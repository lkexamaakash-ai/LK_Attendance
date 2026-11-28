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

// A course may have no dates yet (dates are optional).
const daysLeftOf = (endDate) =>
  endDate ? Math.round((new Date(endDate).getTime() - todayIST().getTime()) / DAY) : null;

const statusOf = (daysLeft) => {
  if (daysLeft === null) return "NO_DATES";
  if (daysLeft < 0) return "EXPIRED";
  if (daysLeft <= EXPIRING_DAYS) return "EXPIRING";
  return "ACTIVE";
};

// ---------- shaping ----------
const enrollmentInclude = { course: { include: { branch: true } } };

const formatEnrollment = (e) => {
  const daysLeft = daysLeftOf(e.endDate);
  return {
    id: e.id,
    courseId: e.courseId,
    courseName: e.course?.name,
    branchId: e.course?.branchId,
    branchName: e.course?.branch?.name,
    startDate: e.startDate,
    endDate: e.endDate,
    daysLeft,
    status: statusOf(daysLeft),
  };
};

// viewerBranchId: a branch admin only sees the courses of their own branch.
const formatStudent = (s, viewerBranchId = null) => {
  const list = (s.enrollments || []).filter((e) => !viewerBranchId || e.course.branchId === viewerBranchId);
  const enrollments = list
    .slice()
    .sort((a, b) => (b.endDate ? new Date(b.endDate).getTime() : -Infinity) - (a.endDate ? new Date(a.endDate).getTime() : -Infinity))
    .map(formatEnrollment);

  const branchNames = [...new Set(enrollments.map((e) => e.branchName))];
  if (branchNames.length === 0 && s.branch?.name) branchNames.push(s.branch.name);

  return {
    id: s.id,
    userId: s.userId,
    name: s.user?.name,
    phoneNumber: s.user?.phoneNumber,
    isActive: s.user?.isActive,
    branchId: s.branchId,
    branchName: branchNames.join(", "),
    branchNames,
    address: s.address,
    email: s.email,
    admissionDate: s.admissionDate,
    currentEnrollment: enrollments[0] || null, // the course that ends last
    enrollments,
  };
};

// ---------- access ----------
const getRequester = async (userId) => {
  const me = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, name: true, role: true, branchId: true },
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

// A branch admin can manage a student who has a course in their branch (or whose home branch is theirs).
const canManage = (me, student) => {
  if (me.role === "SUPER_ADMIN") return true;
  if (me.role !== "BRANCH_ADMIN" || !me.branchId) return false;
  return (
    student.branchId === me.branchId ||
    (student.enrollments || []).some((e) => e.course.branchId === me.branchId)
  );
};

const loadStudentFor = async (me, studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(studentId) },
    include: { user: true, branch: true, enrollments: { include: enrollmentInclude } },
  });
  if (!student) throw new HttpError(404, "Student not found");
  if (!canManage(me, student)) throw new HttpError(403, "Access Denied");
  return student;
};

// ---------- validation ----------
const cleanPhone = (v) => {
  const phone = String(v || "").replace(/\s+/g, "");
  if (!/^\d{10}$/.test(phone)) throw new HttpError(400, "Phone number must be 10 digits");
  return phone;
};

// Both dates are optional. Give both, or leave both empty.
const cleanPeriod = (startDate, endDate) => {
  if (!startDate && !endDate) return { start: null, end: null };
  if (!startDate || !endDate) throw new HttpError(400, "Please give both the start and end date, or leave both empty");
  const start = toDate(startDate, "Start date");
  const end = toDate(endDate, "End date");
  if (end < start) throw new HttpError(400, "End date cannot be before the start date");
  return { start, end };
};

// items: [{ courseId, startDate, endDate }] -> checked, with the course attached.
const cleanCourseItems = async (me, items, { allowEmpty = false } = {}) => {
  if (!Array.isArray(items) || (items.length === 0 && !allowEmpty)) {
    throw new HttpError(400, "Please choose at least one course");
  }
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const courseId = Number(it.courseId);
    if (!Number.isInteger(courseId)) throw new HttpError(400, "Course is not valid");
    if (seen.has(courseId)) throw new HttpError(400, "The same course was chosen twice");
    seen.add(courseId);
    const { start, end } = cleanPeriod(it.startDate, it.endDate);
    out.push({ courseId, start, end });
  }
  if (out.length === 0) return out;

  const courses = await prisma.course.findMany({ where: { id: { in: out.map((o) => o.courseId) } } });
  if (courses.length !== out.length) throw new HttpError(400, "One of the chosen courses was not found");
  const byId = new Map(courses.map((c) => [c.id, c]));
  for (const o of out) {
    o.course = byId.get(o.courseId);
    if (me.role === "BRANCH_ADMIN" && o.course.branchId !== me.branchId) {
      throw new HttpError(403, "You can only add courses of your own branch");
    }
  }
  return out;
};

const requireAdmin = (me) => {
  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(me.role)) throw new HttpError(403, "Access Denied");
  if (me.role === "BRANCH_ADMIN" && !me.branchId) throw new HttpError(403, "No branch is assigned to you");
};

// ---------- branches and courses to choose from ----------
const getOptions = async (userId) => {
  const me = await getRequester(userId);
  requireAdmin(me);
  return prisma.branch.findMany({
    where: me.role === "SUPER_ADMIN" ? {} : { id: me.branchId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      courses: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
};

// ---------- create ----------
const createOne = async ({ branchId, items, input, hashedPassword }) => {
  const name = String(input.name || "").trim();
  if (!name) throw new HttpError(400, "Name is required");
  const phoneNumber = cleanPhone(input.phoneNumber);
  const admissionDate = input.admissionDate
    ? toDate(input.admissionDate, "Admission date")
    : items.find((i) => i.start)?.start || todayIST();

  const exists = await prisma.user.findUnique({ where: { phoneNumber } });
  if (exists) throw new HttpError(409, "This phone number is already registered");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, phoneNumber, password: hashedPassword, role: "STUDENT", mustChangePassword: true },
    });
    const student = await tx.student.create({
      data: {
        userId: user.id,
        branchId, // home branch
        admissionDate,
        address: input.address ? String(input.address).trim() : null,
        email: input.email ? String(input.email).trim() : null,
      },
    });
    for (const it of items) {
      await tx.enrollment.create({
        data: { studentId: student.id, courseId: it.courseId, startDate: it.start, endDate: it.end },
      });
    }
    return { studentId: student.id, name };
  });
};

const createStudent = async (userId, input) => {
  const me = await getRequester(userId);
  requireAdmin(me);
  const items = await cleanCourseItems(me, input.courses);
  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);
  const created = await createOne({ branchId: items[0].course.branchId, items, input, hashedPassword });
  return getProfile(userId, created.studentId);
};

const splitNames = (v) =>
  String(v || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const bulkCreateStudents = async (userId, { branchId: requestedBranch, rows }) => {
  const me = await getRequester(userId);
  const branchId = branchScope(me, requestedBranch);
  if (!branchId) throw new HttpError(400, "Branch is required");
  if (!Array.isArray(rows) || rows.length === 0) throw new HttpError(400, "No rows to import");
  if (rows.length > 500) throw new HttpError(400, "Please import at most 500 students at a time");

  const courses = await prisma.course.findMany({ where: { branchId } });
  const byName = new Map(courses.map((c) => [c.name.trim().toLowerCase(), c]));
  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);

  const created = [];
  const updated = []; // students that were already added: the courses of the sheet are added to them
  const errors = [];
  const warnings = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const sheetRow = i + 2; // +2: the header is row 1 in the Excel sheet
    try {
      // Only the name and the phone number are required. Courses and dates are optional.
      // If something about the course is not usable, the student is still added and a note is returned.
      const items = [];
      const names = splitNames(row.courseNames);
      if (names.length > 0) {
        let period = null;
        try {
          period = cleanPeriod(row.startDate, row.endDate);
        } catch (err) {
          warnings.push({ row: sheetRow, name: row.name, message: `Course not added: ${err.message}` });
        }
        if (period) {
          const missing = [];
          for (const n of names) {
            const course = byName.get(n.toLowerCase());
            if (!course) missing.push(n);
            else if (!items.some((x) => x.courseId === course.id)) {
              items.push({ courseId: course.id, course, start: period.start, end: period.end });
            }
          }
          if (missing.length) {
            warnings.push({ row: sheetRow, name: row.name, message: `Course not found in this branch: ${missing.join(", ")}` });
          }
        }
      }

      // A phone number that is already a student is not an error: the courses of this row are added to them.
      const phone = cleanPhone(row.phoneNumber);
      const existingUser = await prisma.user.findUnique({ where: { phoneNumber: phone }, select: { id: true, role: true } });
      if (existingUser) {
        if (existingUser.role !== "STUDENT") throw new HttpError(409, "This phone number is already registered");
        const student = await prisma.student.findUnique({
          where: { userId: existingUser.id },
          include: { enrollments: { include: enrollmentInclude } },
        });
        if (!student || !canManage(me, student)) throw new HttpError(403, "This student belongs to another branch");
        if (items.length === 0) throw new HttpError(409, "Already added. This row has no course to add");
        await addCoursesTo([student.id], items);
        updated.push({ name: row.name, phoneNumber: phone });
        continue;
      }

      await createOne({ branchId, items, input: row, hashedPassword });
      created.push({ name: row.name, phoneNumber: row.phoneNumber });
    } catch (err) {
      errors.push({
        row: sheetRow,
        name: row.name,
        phoneNumber: row.phoneNumber,
        message: err.status ? err.message : "Could not save this row",
      });
    }
  }
  return { created, updated, errors, warnings };
};

// ---------- read ----------
const profileInclude = {
  user: true,
  branch: true,
  enrollments: { include: enrollmentInclude },
};

const getProfileOf = async (me, where) => {
  const student = await prisma.student.findUnique({ where, include: profileInclude });
  if (!student) throw new HttpError(404, "Student not found");

  const isSelf = me.role === "STUDENT" && student.userId === me.id;
  if (!isSelf && !canManage(me, student)) throw new HttpError(403, "Access Denied");

  return formatStudent(student, me.role === "BRANCH_ADMIN" ? me.branchId : null);
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

  const and = [];
  if (scope) {
    and.push({
      OR: [{ branchId: scope }, { enrollments: { some: { course: { branchId: scope } } } }],
    });
  }
  const search = String(q || "").trim();
  if (search) {
    and.push({
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search } },
        ],
      },
    });
  }
  const where = and.length ? { AND: and } : {};

  const [total, rows] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNo - 1) * take,
      take,
      include: profileInclude,
    }),
  ]);

  return { items: rows.map((s) => formatStudent(s, scope)), total, page: pageNo, pageSize: take };
};

// ---------- update ----------
const updateStudent = async (userId, studentId, input) => {
  const me = await getRequester(userId);
  requireAdmin(me);
  const student = await loadStudentFor(me, studentId);

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

// Sets the courses of a student: adds new ones, updates dates of existing ones and removes the ones left out.
// A branch admin only changes courses of their own branch; a super admin changes all of them.
const setEnrollments = async (userId, studentId, input) => {
  const me = await getRequester(userId);
  requireAdmin(me);
  const student = await loadStudentFor(me, studentId);
  const items = await cleanCourseItems(me, input.courses, { allowEmpty: true });

  const inScope = (e) => me.role === "SUPER_ADMIN" || e.course.branchId === me.branchId;
  const keep = new Set(items.map((i) => i.courseId));
  const existing = student.enrollments.filter(inScope);
  const removed = existing.filter((e) => !keep.has(e.courseId));
  const addedIds = items.filter((i) => !student.enrollments.some((e) => e.courseId === i.courseId)).map((i) => i.courseId);

  await prisma.$transaction([
    ...removed.map((e) => prisma.enrollment.delete({ where: { id: e.id } })),
    ...items.map((i) =>
      prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: i.courseId } },
        update: { startDate: i.start, endDate: i.end },
        create: { studentId: student.id, courseId: i.courseId, startDate: i.start, endDate: i.end },
      }),
    ),
  ]);

  await createAuditLog({
    userId: me.id,
    action: "UPDATE",
    entity: "StudentCourses",
    entityId: student.id,
    oldData: { courses: existing.map((e) => e.course.name) },
    newData: { courseIds: items.map((i) => i.courseId), added: addedIds, removed: removed.map((e) => e.courseId) },
    description: `${me.name} updated the courses of student ${student.user.name}`,
  });

  return getProfile(userId, student.id);
};

// Deletes a student.
// Super admin: the student is deleted completely (login, courses and attendance).
// Branch admin: if the student also has courses in another branch, they are only removed from this
// branch (their courses and attendance here); otherwise the student is deleted completely.
const deleteStudent = async (userId, studentId) => {
  const me = await getRequester(userId);
  requireAdmin(me);
  const student = await loadStudentFor(me, studentId);

  const otherBranchCourses =
    me.role === "BRANCH_ADMIN"
      ? student.enrollments.filter((e) => e.course.branchId !== me.branchId)
      : [];

  if (otherBranchCourses.length > 0) {
    await prisma.$transaction([
      prisma.studentAttendance.deleteMany({
        where: { studentId: student.id, batch: { course: { branchId: me.branchId } } },
      }),
      prisma.enrollment.deleteMany({
        where: { studentId: student.id, course: { branchId: me.branchId } },
      }),
    ]);
    await createAuditLog({
      userId: me.id,
      action: "DELETE",
      entity: "StudentBranch",
      entityId: student.id,
      oldData: { name: student.user.name, phoneNumber: student.user.phoneNumber },
      description: `${me.name} removed student ${student.user.name} from their branch`,
    });
    return { deleted: false, removedFromBranch: true, name: student.user.name };
  }

  await prisma.$transaction([
    prisma.studentAttendance.deleteMany({ where: { studentId: student.id } }),
    prisma.enrollment.deleteMany({ where: { studentId: student.id } }),
    prisma.student.delete({ where: { id: student.id } }),
    prisma.user.delete({ where: { id: student.userId } }),
  ]);
  await createAuditLog({
    userId: me.id,
    action: "DELETE",
    entity: "Student",
    entityId: student.id,
    oldData: { name: student.user.name, phoneNumber: student.user.phoneNumber },
    description: `${me.name} deleted student ${student.user.name}`,
  });
  return { deleted: true, removedFromBranch: false, name: student.user.name };
};

// ---------- ids of all students matching a search (for "select all") ----------
const listStudentIds = async (userId, { branchId, q }) => {
  const me = await getRequester(userId);
  const scope = branchScope(me, branchId);
  const and = [];
  if (scope) {
    and.push({ OR: [{ branchId: scope }, { enrollments: { some: { course: { branchId: scope } } } }] });
  }
  const search = String(q || "").trim();
  if (search) {
    and.push({
      user: { OR: [{ name: { contains: search, mode: "insensitive" } }, { phoneNumber: { contains: search } }] },
    });
  }
  const rows = await prisma.student.findMany({
    where: and.length ? { AND: and } : {},
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.id);
};

// Adds (or updates the dates of) one set of courses for a student. Never removes anything.
const addCoursesTo = async (studentIds, items) => {
  for (const it of items) {
    const existing = await prisma.enrollment.findMany({
      where: { courseId: it.courseId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const have = new Set(existing.map((e) => e.studentId));
    const toCreate = studentIds.filter((id) => !have.has(id));
    if (toCreate.length) {
      await prisma.enrollment.createMany({
        data: toCreate.map((studentId) => ({ studentId, courseId: it.courseId, startDate: it.start, endDate: it.end })),
        skipDuplicates: true,
      });
    }
    // only touch the dates of courses the student already had if new dates were given
    if (it.start && it.end && have.size) {
      await prisma.enrollment.updateMany({
        where: { courseId: it.courseId, studentId: { in: [...have] } },
        data: { startDate: it.start, endDate: it.end },
      });
    }
  }
};

// ---------- delete many students at once ----------
// Same rules as deleting one: a super admin deletes them completely. A branch admin removes students
// who also study in another branch only from their own branch, and deletes the others completely.
const deleteMany = async (userId, input) => {
  const me = await getRequester(userId);
  requireAdmin(me);

  const ids = [...new Set((input.studentIds || []).map(Number).filter((n) => Number.isInteger(n)))];
  if (ids.length === 0) throw new HttpError(400, "Please select at least one student");
  if (ids.length > 1000) throw new HttpError(400, "Please select at most 1000 students at a time");

  const students = await prisma.student.findMany({
    where: { id: { in: ids } },
    include: { user: true, enrollments: { include: enrollmentInclude } },
  });
  const allowed = students.filter((s) => canManage(me, s));
  if (allowed.length === 0) throw new HttpError(403, "Access Denied");

  const partial = [];
  const full = [];
  for (const s of allowed) {
    const elsewhere = me.role === "BRANCH_ADMIN" && s.enrollments.some((e) => e.course.branchId !== me.branchId);
    (elsewhere ? partial : full).push(s);
  }

  const fullIds = full.map((s) => s.id);
  const operations = [];
  if (partial.length) {
    const partialIds = partial.map((s) => s.id);
    operations.push(
      prisma.studentAttendance.deleteMany({
        where: { studentId: { in: partialIds }, batch: { course: { branchId: me.branchId } } },
      }),
      prisma.enrollment.deleteMany({
        where: { studentId: { in: partialIds }, course: { branchId: me.branchId } },
      }),
    );
  }
  if (full.length) {
    operations.push(
      prisma.studentAttendance.deleteMany({ where: { studentId: { in: fullIds } } }),
      prisma.enrollment.deleteMany({ where: { studentId: { in: fullIds } } }),
      prisma.student.deleteMany({ where: { id: { in: fullIds } } }),
      prisma.user.deleteMany({ where: { id: { in: full.map((s) => s.userId) } } }),
    );
  }
  await prisma.$transaction(operations);

  await createAuditLog({
    userId: me.id,
    action: "DELETE",
    entity: "Student",
    entityId: allowed[0].id,
    oldData: { deleted: full.map((s) => s.user.name), removedFromBranch: partial.map((s) => s.user.name) },
    description: `${me.name} deleted ${full.length} student(s) and removed ${partial.length} from their branch`,
  });

  return {
    deleted: full.length,
    removedFromBranch: partial.length,
    skipped: ids.length - allowed.length,
  };
};

module.exports = {
  HttpError,
  deleteMany,
  listStudentIds,
  deleteStudent,
  getOptions,
  createStudent,
  bulkCreateStudents,
  listStudents,
  getProfile,
  getMe,
  updateStudent,
  setEnrollments,
};
