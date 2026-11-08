const bcrypt = require("bcrypt");
const { prisma } = require("../../config/db");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 15;

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
const enrollmentInclude = { batch: { include: { course: true } } };

const formatEnrollment = (e) => {
  if (!e) return null;
  const daysLeft = daysLeftOf(e.endDate);
  return {
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

// ---------- create ----------
const createOne = async ({ branchId, batch, input, hashedPassword }) => {
  const name = String(input.name || "").trim();
  if (!name) throw new HttpError(400, "Name is required");
  const phoneNumber = cleanPhone(input.phoneNumber);
  const { start, end } = cleanPeriod(input.startDate, input.endDate);
  const totalFee = cleanFee(input.totalFee);
  const admissionDate = input.admissionDate ? toDate(input.admissionDate, "Admission date") : start;

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
    await tx.enrollment.create({
      data: { studentId: student.id, batchId: batch.id, startDate: start, endDate: end, totalFee },
    });
    return student.id;
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
  const id = await createOne({ branchId, batch, input, hashedPassword });
  return getProfile(userId, id);
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
      await createOne({ branchId, batch, input: row, hashedPassword });
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
    enrollments: student.enrollments.map(formatEnrollment),
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
  if (input.totalFee !== undefined) data.totalFee = cleanFee(input.totalFee);

  await prisma.enrollment.update({ where: { id: enrollment.id }, data });
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
};
