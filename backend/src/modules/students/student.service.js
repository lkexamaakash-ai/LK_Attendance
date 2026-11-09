const bcrypt = require("bcrypt");
const { prisma } = require("../../config/db");
const { createAuditLog } = require("../../utils/auditLogger");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 15;
const PLANS = ["FULL", "DOWN_PAYMENT", "EMI"];
const MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD"];
const MODE_LABEL = { CASH: "Cash", UPI: "UPI", BANK_TRANSFER: "Bank transfer", CHEQUE: "Cheque", CARD: "Card" };
const sum = (rows) => rows.reduce((t, r) => t + (r.amount || 0), 0);

const getDefaultPassword = () => {
  const pass = process.env.DEFAULT_PASSWORD;
  if (!pass) throw new HttpError(500, "DEFAULT_PASSWORD is not configured on the server");
  return pass;
};

// ---------- dates ----------
// Today's date in India (IST), as a UTC-midnight Date so it can be compared with DATE columns.
const todayIST = () => {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
};

const toDate = (value, label) => {
  if (!value) throw new HttpError(400, `${label} is required`);
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${label} is not a valid date (use YYYY-MM-DD)`);
  return d;
};

const daysLeftOf = (endDate) => Math.round((new Date(endDate).getTime() - todayIST().getTime()) / DAY);

const statusOf = (daysLeft) => {
  if (daysLeft < 0) return "EXPIRED";
  if (daysLeft <= EXPIRING_DAYS) return "EXPIRING";
  return "ACTIVE";
};

// ---------- shaping ----------
const enrollmentInclude = {
  batch: { include: { course: true } },
  installments: { orderBy: { number: "asc" } },
  payments: {
    orderBy: [{ paidOn: "desc" }, { id: "desc" }],
    include: { recordedBy: { select: { name: true } } },
  },
};

// Works out fee totals, balance, status and installment progress for one enrollment.
const paymentSummary = (e) => {
  const today = todayIST();
  const payments = e.payments || [];
  const paid = sum(payments);
  const balance = Math.max(0, (e.totalFee || 0) - paid);

  const installments = (e.installments || []).map((i) => {
    const got = sum(payments.filter((p) => p.installmentId === i.id));
    let status = "PENDING";
    if (got >= i.amount) status = "PAID";
    else if (new Date(i.dueDate) < today) status = "OVERDUE";
    else if (got > 0) status = "PARTIAL";
    return {
      id: i.id,
      number: i.number,
      dueDate: i.dueDate,
      amount: i.amount,
      paid: got,
      balance: Math.max(0, i.amount - got),
      status,
    };
  });

  const nextInstallment = installments.find((i) => i.status !== "PAID");
  let nextDue = null;
  if (nextInstallment) nextDue = { date: nextInstallment.dueDate, amount: nextInstallment.balance };
  else if (e.planType === "DOWN_PAYMENT" && e.balanceDueDate && balance > 0) {
    nextDue = { date: e.balanceDueDate, amount: balance };
  }

  const overdue =
    installments.some((i) => i.status === "OVERDUE") ||
    (e.planType === "DOWN_PAYMENT" && e.balanceDueDate && balance > 0 && new Date(e.balanceDueDate) < today);

  let paymentStatus = "PENDING";
  if ((e.totalFee || 0) <= 0) paymentStatus = "NO_FEE";
  else if (balance === 0) paymentStatus = "PAID";
  else if (overdue) paymentStatus = "OVERDUE";
  else if (paid > 0) paymentStatus = "PARTIAL";

  return { paid, balance, paymentStatus, nextDue, installments };
};

const formatEnrollment = (e, withDetails = false) => {
  if (!e) return null;
  const daysLeft = daysLeftOf(e.endDate);
  const pay = paymentSummary(e);
  const base = {
    id: e.id,
    batchId: e.batchId,
    batchName: e.batch?.name,
    courseId: e.batch?.courseId,
    courseName: e.batch?.course?.name,
    startDate: e.startDate,
    endDate: e.endDate,
    totalFee: e.totalFee,
    daysLeft,
    status: statusOf(daysLeft),
    planType: e.planType || null,
    balanceDueDate: e.balanceDueDate || null,
    paid: pay.paid,
    balance: pay.balance,
    paymentStatus: pay.paymentStatus,
    nextDue: pay.nextDue,
  };
  if (!withDetails) return base;
  const numberOf = new Map(pay.installments.map((i) => [i.id, i.number]));
  return {
    ...base,
    installments: pay.installments,
    payments: (e.payments || []).map((p) => ({
      id: p.id,
      amount: p.amount,
      paidOn: p.paidOn,
      mode: p.mode,
      receiptNo: p.receiptNo,
      note: p.note,
      installmentId: p.installmentId,
      installmentNumber: p.installmentId ? numberOf.get(p.installmentId) || null : null,
      recordedBy: p.recordedBy?.name || null,
    })),
  };
};

const formatStudent = (s) => ({
  id: s.id,
  userId: s.userId,
  name: s.user?.name,
  phoneNumber: s.user?.phoneNumber,
  isActive: s.user?.isActive,
  branchId: s.branchId,
  branchName: s.branch?.name,
  address: s.address,
  email: s.email,
  admissionDate: s.admissionDate,
  currentEnrollment: formatEnrollment(s.enrollments?.[0]),
});

// ---------- access ----------
const getRequester = async (userId) => {
  const me = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, role: true, branchId: true },
  });
  if (!me) throw new HttpError(401, "User not found");
  return me;
};

// Which branch can this admin work in? Super admin: any. Branch admin: only their own.
const branchScope = (me, requestedBranchId) => {
  const requested = requestedBranchId ? Number(requestedBranchId) : null;
  if (me.role === "SUPER_ADMIN") return requested;
  if (me.role === "BRANCH_ADMIN") {
    if (!me.branchId) throw new HttpError(403, "No branch is assigned to you");
    if (requested && requested !== me.branchId) throw new HttpError(403, "You can only manage students of your own branch");
    return me.branchId;
  }
  throw new HttpError(403, "Access Denied");
};

const assertCanManage = (me, student) => {
  if (me.role === "SUPER_ADMIN") return;
  if (me.role === "BRANCH_ADMIN" && me.branchId === student.branchId) return;
  throw new HttpError(403, "Access Denied");
};

// ---------- validation ----------
const cleanPhone = (v) => {
  const phone = String(v || "").replace(/\s+/g, "");
  if (!/^\d{10}$/.test(phone)) throw new HttpError(400, "Phone number must be 10 digits");
  return phone;
};

const cleanFee = (v) => {
  const fee = v === undefined || v === null || v === "" ? 0 : Number(v);
  if (!Number.isInteger(fee) || fee < 0) throw new HttpError(400, "Total fee must be a whole number, 0 or more");
  return fee;
};

const cleanPeriod = (startDate, endDate) => {
  const start = toDate(startDate, "Start date");
  const end = toDate(endDate, "End date");
  if (end < start) throw new HttpError(400, "End date cannot be before the start date");
  return { start, end };
};

// ---------- payment plan (optional when adding a student) ----------
const cleanMode = (v) => {
  const mode = String(v || "").toUpperCase();
  if (!MODES.includes(mode)) throw new HttpError(400, "Please choose how the payment was made (cash, UPI, bank transfer, cheque or card)");
  return mode;
};

const cleanPaidOn = (v) => {
  const date = v ? toDate(v, "Payment date") : todayIST();
  if (date > todayIST()) throw new HttpError(400, "Payment date cannot be in the future");
  return date;
};

const cleanMoney = (v, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${label} must be a whole number above 0`);
  return n;
};

const buildPlan = (payment, totalFee) => {
  const none = { planType: null, balanceDueDate: null, payments: [], installments: [] };
  if (!payment || !payment.planType) return none;
  if (!PLANS.includes(payment.planType)) throw new HttpError(400, "Payment plan is not valid");

  const paidRaw = payment.paidNow?.amount;
  const paidNow = paidRaw === undefined || paidRaw === null || paidRaw === "" ? 0 : Number(paidRaw);
  if (!Number.isInteger(paidNow) || paidNow < 0) throw new HttpError(400, "Amount paid must be a whole number, 0 or more");
  if (paidNow > totalFee) throw new HttpError(400, "Amount paid cannot be more than the total fee");

  const payments = [];
  if (paidNow > 0) {
    payments.push({
      amount: paidNow,
      paidOn: cleanPaidOn(payment.paidNow.date),
      mode: cleanMode(payment.paidNow.mode),
      receiptNo: payment.paidNow.receiptNo ? String(payment.paidNow.receiptNo).trim() : null,
      note: payment.paidNow.note ? String(payment.paidNow.note).trim() : null,
    });
  }

  if (payment.planType === "FULL") {
    if (totalFee > 0 && paidNow !== totalFee) throw new HttpError(400, "For a full payment, the amount paid must equal the total fee");
    return { planType: "FULL", balanceDueDate: null, payments, installments: [] };
  }

  if (payment.planType === "DOWN_PAYMENT") {
    if (!(paidNow > 0 && paidNow < totalFee)) throw new HttpError(400, "For a down payment, enter an amount above 0 and below the total fee");
    const balanceDueDate = payment.balanceDueDate ? toDate(payment.balanceDueDate, "Balance due date") : null;
    return { planType: "DOWN_PAYMENT", balanceDueDate, payments, installments: [] };
  }

  // EMI
  const rows = Array.isArray(payment.installments) ? payment.installments : [];
  if (rows.length < 1 || rows.length > 36) throw new HttpError(400, "Please add between 1 and 36 installments");
  const remaining = totalFee - paidNow;
  if (remaining <= 0) throw new HttpError(400, "There is nothing left to pay in installments");
  const installments = rows.map((r, i) => ({
    number: i + 1,
    dueDate: toDate(r.dueDate, `Installment ${i + 1} due date`),
    amount: cleanMoney(r.amount, `Installment ${i + 1} amount`),
  }));
  const total = sum(installments);
  if (total !== remaining) {
    throw new HttpError(400, `Installments add up to ₹${total}, but ₹${remaining} is left to pay after the amount paid now`);
  }
  return { planType: "EMI", balanceDueDate: null, payments, installments };
};

// ---------- create ----------
const createOne = async ({ branchId, batch, input, hashedPassword, recordedById }) => {
  const name = String(input.name || "").trim();
  if (!name) throw new HttpError(400, "Name is required");
  const phoneNumber = cleanPhone(input.phoneNumber);
  const { start, end } = cleanPeriod(input.startDate, input.endDate);
  const totalFee = cleanFee(input.totalFee);
  const admissionDate = input.admissionDate ? toDate(input.admissionDate, "Admission date") : start;

  const plan = buildPlan(input.payment, totalFee);

  const exists = await prisma.user.findUnique({ where: { phoneNumber } });
  if (exists) throw new HttpError(409, "This phone number is already registered");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        phoneNumber,
        password: hashedPassword,
        role: "STUDENT",
        mustChangePassword: true,
      },
    });
    const student = await tx.student.create({
      data: {
        userId: user.id,
        branchId,
        admissionDate,
        address: input.address ? String(input.address).trim() : null,
        email: input.email ? String(input.email).trim() : null,
      },
    });
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        batchId: batch.id,
        startDate: start,
        endDate: end,
        totalFee,
        planType: plan.planType,
        balanceDueDate: plan.balanceDueDate,
      },
    });
    for (const i of plan.installments) {
      await tx.installment.create({ data: { enrollmentId: enrollment.id, ...i } });
    }
    for (const pay of plan.payments) {
      await tx.payment.create({ data: { enrollmentId: enrollment.id, recordedById, ...pay } });
    }
    return { studentId: student.id, name, payments: plan.payments };
  });
};

const loadBatchForBranch = async (batchId, branchId) => {
  if (!batchId) throw new HttpError(400, "Batch is required");
  const batch = await prisma.batch.findUnique({
    where: { id: Number(batchId) },
    include: { course: true },
  });
  if (!batch || batch.course.branchId !== branchId) {
    throw new HttpError(400, "This batch does not belong to the selected branch");
  }
  return batch;
};

const createStudent = async (userId, input) => {
  const me = await getRequester(userId);
  const branchId = branchScope(me, input.branchId);
  if (!branchId) throw new HttpError(400, "Branch is required");

  const batch = await loadBatchForBranch(input.batchId, branchId);
  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);
  const created = await createOne({ branchId, batch, input, hashedPassword, recordedById: me.id });
  for (const pay of created.payments) {
    await createAuditLog({
      userId: me.id,
      action: "RECORD_PAYMENT",
      entity: "PAYMENT",
      entityId: created.studentId,
      newData: { amount: pay.amount, mode: pay.mode, paidOn: pay.paidOn },
      description: `Recorded payment of ₹${pay.amount} (${MODE_LABEL[pay.mode]}) for new student ${created.name}`,
    });
  }
  return getProfile(userId, created.studentId);
};

const bulkCreateStudents = async (userId, { branchId: requestedBranch, rows }) => {
  const me = await getRequester(userId);
  const branchId = branchScope(me, requestedBranch);
  if (!branchId) throw new HttpError(400, "Branch is required");
  if (!Array.isArray(rows) || rows.length === 0) throw new HttpError(400, "No rows to import");
  if (rows.length > 500) throw new HttpError(400, "Please import at most 500 students at a time");

  const batches = await prisma.batch.findMany({
    where: { course: { branchId } },
    include: { course: true },
  });
  const key = (course, batch) => `${String(course || "").trim().toLowerCase()}|${String(batch || "").trim().toLowerCase()}`;
  const byName = new Map(batches.map((b) => [key(b.course.name, b.name), b]));
  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);

  const created = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    try {
      const batch = byName.get(key(row.courseName, row.batchName));
      if (!batch) {
        throw new HttpError(400, `Course "${row.courseName || ""}" with batch "${row.batchName || ""}" was not found in this branch`);
      }
      const amountPaid = row.amountPaid === undefined || row.amountPaid === null || row.amountPaid === "" ? 0 : Number(row.amountPaid);
      let withPayment = row;
      if (amountPaid > 0) {
        if (!row.paymentMode) throw new HttpError(400, "Payment mode is required when an amount paid is given");
        const fee = cleanFee(row.totalFee);
        const when = row.admissionDate || row.startDate;
        withPayment = {
          ...row,
          payment: {
            planType: amountPaid >= fee ? "FULL" : "DOWN_PAYMENT",
            paidNow: {
              amount: amountPaid,
              mode: String(row.paymentMode).trim().toUpperCase().replace(/[\s-]+/g, "_"),
              date: String(when).slice(0, 10) > todayIST().toISOString().slice(0, 10) ? undefined : when,
            },
          },
        };
      }
      await createOne({ branchId, batch, input: withPayment, hashedPassword, recordedById: me.id });
      created.push({ name: row.name, phoneNumber: row.phoneNumber });
    } catch (err) {
      errors.push({
        row: i + 2, // +2: header row is row 1 in the Excel sheet
        name: row.name,
        phoneNumber: row.phoneNumber,
        message: err.status ? err.message : "Could not save this row",
      });
    }
  }
  return { created, errors };
};

// ---------- read ----------
const profileInclude = {
  user: true,
  branch: true,
  enrollments: { orderBy: { endDate: "desc" }, include: enrollmentInclude },
};

const getProfileOf = async (me, where) => {
  const student = await prisma.student.findUnique({ where, include: profileInclude });
  if (!student) throw new HttpError(404, "Student not found");

  const isSelf = me.role === "STUDENT" && student.userId === me.id;
  const isAdmin =
    me.role === "SUPER_ADMIN" || (me.role === "BRANCH_ADMIN" && me.branchId === student.branchId);
  if (!isSelf && !isAdmin) throw new HttpError(403, "Access Denied");

  return {
    ...formatStudent(student),
    enrollments: student.enrollments.map((e) => formatEnrollment(e, true)),
  };
};

const getProfile = async (userId, studentId) => {
  const me = await getRequester(userId);
  return getProfileOf(me, { id: Number(studentId) });
};

const getMe = async (userId) => {
  const me = await getRequester(userId);
  if (me.role !== "STUDENT") throw new HttpError(403, "Access Denied");
  return getProfileOf(me, { userId: me.id });
};

const listStudents = async (userId, { branchId, q, page = 1, pageSize = 25 }) => {
  const me = await getRequester(userId);
  const scope = branchScope(me, branchId);

  const take = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const pageNo = Math.max(Number(page) || 1, 1);

  const where = {};
  if (scope) where.branchId = scope;
  const search = String(q || "").trim();
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search } },
      ],
    };
  }

  const [total, rows] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNo - 1) * take,
      take,
      include: {
        user: true,
        branch: true,
        enrollments: { orderBy: { endDate: "desc" }, take: 1, include: enrollmentInclude },
      },
    }),
  ]);

  return { items: rows.map(formatStudent), total, page: pageNo, pageSize: take };
};

// ---------- update ----------
const updateStudent = async (userId, studentId, input) => {
  const me = await getRequester(userId);
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
  if (!student) throw new HttpError(404, "Student not found");
  assertCanManage(me, student);

  const userData = {};
  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw new HttpError(400, "Name cannot be empty");
    userData.name = name;
  }
  if (input.phoneNumber !== undefined) {
    const phoneNumber = cleanPhone(input.phoneNumber);
    const other = await prisma.user.findUnique({ where: { phoneNumber } });
    if (other && other.id !== student.userId) throw new HttpError(409, "This phone number is already registered");
    userData.phoneNumber = phoneNumber;
  }
  if (input.isActive !== undefined) userData.isActive = !!input.isActive;

  const studentData = {};
  if (input.address !== undefined) studentData.address = input.address ? String(input.address).trim() : null;
  if (input.email !== undefined) studentData.email = input.email ? String(input.email).trim() : null;
  if (input.admissionDate) studentData.admissionDate = toDate(input.admissionDate, "Admission date");

  await prisma.$transaction([
    prisma.user.update({ where: { id: student.userId }, data: userData }),
    prisma.student.update({ where: { id: student.id }, data: studentData }),
  ]);

  return getProfile(userId, student.id);
};

const updateEnrollment = async (userId, studentId, enrollmentId, input) => {
  const me = await getRequester(userId);
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
  if (!student) throw new HttpError(404, "Student not found");
  assertCanManage(me, student);

  const enrollment = await prisma.enrollment.findUnique({ where: { id: Number(enrollmentId) } });
  if (!enrollment || enrollment.studentId !== student.id) throw new HttpError(404, "Enrollment not found");

  const data = {};
  if (input.batchId !== undefined) {
    const batch = await loadBatchForBranch(input.batchId, student.branchId);
    data.batchId = batch.id;
  }
  const start = input.startDate ? toDate(input.startDate, "Start date") : enrollment.startDate;
  const end = input.endDate ? toDate(input.endDate, "End date") : enrollment.endDate;
  if (end < start) throw new HttpError(400, "End date cannot be before the start date");
  if (input.startDate) data.startDate = start;
  if (input.endDate) data.endDate = end;
  if (input.totalFee !== undefined) {
    const fee = cleanFee(input.totalFee);
    const already = await prisma.payment.findMany({ where: { enrollmentId: enrollment.id } });
    if (fee < sum(already)) {
      throw new HttpError(400, `Total fee cannot be less than the ₹${sum(already)} already paid`);
    }
    data.totalFee = fee;
  }

  await prisma.enrollment.update({ where: { id: enrollment.id }, data });
  return getProfile(userId, student.id);
};

// ---------- payments ----------
const loadEnrollmentForPayment = async (userId, studentId, enrollmentId) => {
  const me = await getRequester(userId);
  const student = await prisma.student.findUnique({ where: { id: Number(studentId) }, include: { user: true } });
  if (!student) throw new HttpError(404, "Student not found");
  assertCanManage(me, student);
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: Number(enrollmentId) },
    include: { installments: true, payments: true },
  });
  if (!enrollment || enrollment.studentId !== student.id) throw new HttpError(404, "Enrollment not found");
  return { me, student, enrollment };
};

const recordPayment = async (userId, studentId, enrollmentId, input) => {
  const { me, student, enrollment } = await loadEnrollmentForPayment(userId, studentId, enrollmentId);

  const amount = cleanMoney(input.amount, "Amount");
  const mode = cleanMode(input.mode);
  const paidOn = cleanPaidOn(input.paidOn);

  const summary = paymentSummary(enrollment);
  if (amount > summary.balance) {
    throw new HttpError(400, `Amount is more than the balance of ₹${summary.balance}`);
  }

  let installmentId = null;
  if (input.installmentId) {
    const inst = summary.installments.find((i) => i.id === Number(input.installmentId));
    if (!inst) throw new HttpError(400, "That installment does not belong to this course period");
    if (amount > inst.balance) throw new HttpError(400, `Amount is more than the ₹${inst.balance} left on installment ${inst.number}`);
    installmentId = inst.id;
  }

  const payment = await prisma.payment.create({
    data: {
      enrollmentId: enrollment.id,
      installmentId,
      amount,
      paidOn,
      mode,
      receiptNo: input.receiptNo ? String(input.receiptNo).trim() : null,
      note: input.note ? String(input.note).trim() : null,
      recordedById: me.id,
    },
  });

  await createAuditLog({
    userId: me.id,
    action: "RECORD_PAYMENT",
    entity: "PAYMENT",
    entityId: payment.id,
    newData: { studentId: student.id, amount, mode, paidOn, installmentId },
    description: `Recorded payment of ₹${amount} (${MODE_LABEL[mode]}) for ${student.user.name}`,
  });

  return getProfile(userId, student.id);
};

const deletePayment = async (userId, studentId, enrollmentId, paymentId) => {
  const { me, student, enrollment } = await loadEnrollmentForPayment(userId, studentId, enrollmentId);
  const payment = enrollment.payments.find((p) => p.id === Number(paymentId));
  if (!payment) throw new HttpError(404, "Payment not found");

  await prisma.payment.delete({ where: { id: payment.id } });

  await createAuditLog({
    userId: me.id,
    action: "DELETE_PAYMENT",
    entity: "PAYMENT",
    entityId: payment.id,
    oldData: {
      studentId: student.id,
      amount: payment.amount,
      mode: payment.mode,
      paidOn: payment.paidOn,
      receiptNo: payment.receiptNo,
    },
    description: `Deleted payment of ₹${payment.amount} (${MODE_LABEL[payment.mode]}) for ${student.user.name}`,
  });

  return getProfile(userId, student.id);
};

module.exports = {
  HttpError,
  createStudent,
  bulkCreateStudents,
  listStudents,
  getProfile,
  getMe,
  updateStudent,
  updateEnrollment,
  recordPayment,
  deletePayment,
};
