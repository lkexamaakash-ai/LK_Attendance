const { prisma } = require("../../config/db");
const { createAuditLog } = require("../../utils/auditLogger");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const STATUSES = ["PRESENT", "ABSENT"];

// ---------- dates ----------
// Today's date in India (IST), as a UTC-midnight Date so it can be compared with DATE columns.
const todayIST = () => {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
};

const toDate = (value, label = "date") => {
  if (!value) throw new HttpError(400, `${label} is required`);
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${label} is not valid (use YYYY-MM-DD)`);
  return d;
};

const DAY = 24 * 60 * 60 * 1000;

// ---------- access ----------
const getActor = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, name: true, role: true, branchId: true, isActive: true },
  });
  if (!user || !user.isActive) throw new HttpError(401, "User not found or inactive");
  return user;
};

const lectureInclude = {
  subject: { select: { id: true, name: true } },
  faculty: { select: { id: true, name: true } },
  batch: {
    select: {
      id: true,
      name: true,
      course: { select: { id: true, name: true, branchId: true, branch: { select: { id: true, name: true } } } },
    },
  },
};

// Loads a lecture and checks the actor may mark attendance for it.
// Super admin: any lecture. Branch admin: lectures of batches in their own branch.
// Faculty: only their own lectures.
const loadLectureFor = async (actor, lectureId) => {
  const lecture = await prisma.lectureSchedule.findUnique({
    where: { id: Number(lectureId) },
    include: lectureInclude,
  });
  if (!lecture) throw new HttpError(404, "Lecture not found");

  if (actor.role === "BRANCH_ADMIN" && lecture.batch.course.branchId !== actor.branchId) {
    throw new HttpError(403, "This lecture belongs to another branch");
  }
  if (actor.role === "FACULTY" && lecture.facultyId !== actor.id) {
    throw new HttpError(403, "You can only mark attendance for your own lectures");
  }
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "FACULTY"].includes(actor.role)) {
    throw new HttpError(403, "Access Denied");
  }
  return lecture;
};

const shapeLecture = (l) => ({
  id: l.id,
  startTime: l.startTime,
  endTime: l.endTime,
  subject: l.subject,
  faculty: l.faculty,
  batch: { id: l.batch.id, name: l.batch.name },
  course: { id: l.batch.course.id, name: l.batch.course.name },
  branch: l.batch.course.branch,
});

// ---------- lectures available for marking on a date ----------
const listLectures = async (userId, query) => {
  const actor = await getActor(userId);
  const date = toDate(query.date);
  const dayEnd = new Date(date.getTime() + DAY - 1);

  const where = {
    StartDate: { lte: dayEnd },
    EndDate: { gte: date },
  };

  if (actor.role === "FACULTY") {
    where.facultyId = actor.id;
  } else if (actor.role === "BRANCH_ADMIN") {
    where.batch = { course: { branchId: actor.branchId } };
  } else if (actor.role === "SUPER_ADMIN") {
    if (query.branchId) where.batch = { course: { branchId: Number(query.branchId) } };
  } else {
    throw new HttpError(403, "Access Denied");
  }
  if (query.batchId) where.batchId = Number(query.batchId);

  const lectures = await prisma.lectureSchedule.findMany({
    where,
    include: lectureInclude,
    orderBy: [{ batchId: "asc" }, { startTime: "asc" }],
  });

  // how many students are marked already for each lecture on this date
  const marked = lectures.length
    ? await prisma.studentAttendance.groupBy({
        by: ["lectureId"],
        where: { date, lectureId: { in: lectures.map((l) => l.id) } },
        _count: { _all: true },
      })
    : [];
  const markedMap = Object.fromEntries(marked.map((m) => [m.lectureId, m._count._all]));

  // students are enrolled in courses (they can attend any batch of the course)
  const courseIds = [...new Set(lectures.map((l) => l.batch.course.id))];
  const enrolled = courseIds.length
    ? await prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      })
    : [];
  const enrolledMap = Object.fromEntries(enrolled.map((e) => [e.courseId, e._count._all]));

  return lectures.map((l) => ({
    ...shapeLecture(l),
    studentCount: enrolledMap[l.batch.course.id] || 0,
    markedCount: markedMap[l.id] || 0,
  }));
};

// ---------- the sheet: students of the batch + what is already marked ----------
const getSheet = async (userId, query) => {
  const actor = await getActor(userId);
  const date = toDate(query.date);
  const lecture = await loadLectureFor(actor, query.lectureId);

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: lecture.batch.course.id },
    select: {
      studentId: true,
      student: { select: { id: true, user: { select: { name: true, phoneNumber: true } } } },
    },
  });

  // every student enrolled in the lecture's course is listed, whichever batch they usually attend
  const seen = new Set();
  const students = [];
  for (const e of enrollments) {
    if (seen.has(e.studentId)) continue;
    seen.add(e.studentId);
    students.push({
      id: e.student.id,
      name: e.student.user.name,
      phoneNumber: e.student.user.phoneNumber,
    });
  }
  students.sort((a, b) => a.name.localeCompare(b.name));

  const records = await prisma.studentAttendance.findMany({
    where: { lectureId: lecture.id, date },
    select: { studentId: true, status: true },
  });
  const statusMap = Object.fromEntries(records.map((r) => [r.studentId, r.status]));

  return {
    lecture: shapeLecture(lecture),
    date,
    alreadyMarked: records.length > 0,
    students: students.map((s) => ({ ...s, status: statusMap[s.id] || null })),
  };
};

// ---------- save ----------
const saveAttendance = async (userId, body) => {
  const actor = await getActor(userId);
  const date = toDate(body.date);
  const lecture = await loadLectureFor(actor, body.lectureId);

  const today = todayIST();
  if (date.getTime() > today.getTime()) {
    throw new HttpError(400, "Attendance cannot be marked for a future date");
  }
  // Faculty can only mark today. Branch admin and super admin can mark or edit any past date.
  if (actor.role === "FACULTY" && date.getTime() !== today.getTime()) {
    throw new HttpError(403, "Faculty can only mark attendance for today. Ask the branch admin to edit past dates");
  }

  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length) throw new HttpError(400, "No students to save");

  for (const r of records) {
    if (!STATUSES.includes(r.status)) {
      throw new HttpError(400, "Status must be PRESENT or ABSENT");
    }
  }

  // every student must really be enrolled in this lecture's course
  const enrolled = await prisma.enrollment.findMany({
    where: { courseId: lecture.batch.course.id },
    select: { studentId: true },
  });
  const enrolledIds = new Set(enrolled.map((e) => e.studentId));
  for (const r of records) {
    if (!enrolledIds.has(Number(r.studentId))) {
      throw new HttpError(400, `Student ${r.studentId} is not enrolled in this course`);
    }
  }

  const ids = records.map((r) => Number(r.studentId));
  const before = await prisma.studentAttendance.findMany({
    where: { lectureId: lecture.id, date, studentId: { in: ids } },
    select: { studentId: true, status: true },
  });
  const beforeMap = Object.fromEntries(before.map((b) => [b.studentId, b.status]));

  await prisma.$transaction(
    records.map((r) =>
      prisma.studentAttendance.upsert({
        where: {
          studentId_lectureId_date: { studentId: Number(r.studentId), lectureId: lecture.id, date },
        },
        update: { status: r.status, markedById: actor.id },
        create: {
          studentId: Number(r.studentId),
          batchId: lecture.batchId,
          lectureId: lecture.id,
          date,
          status: r.status,
          markedById: actor.id,
        },
      }),
    ),
  );

  const present = records.filter((r) => r.status === "PRESENT").length;
  const changed = records
    .filter((r) => beforeMap[Number(r.studentId)] && beforeMap[Number(r.studentId)] !== r.status)
    .map((r) => ({ studentId: Number(r.studentId), from: beforeMap[Number(r.studentId)], to: r.status }));

  await createAuditLog({
    userId: actor.id,
    action: before.length ? "UPDATE" : "CREATE",
    entity: "StudentAttendance",
    entityId: lecture.id,
    oldData: before.length ? beforeMap : undefined,
    newData: { date: String(body.date).slice(0, 10), lectureId: lecture.id, batchId: lecture.batchId, present, absent: records.length - present, changed },
    description: `${actor.name} marked student attendance for batch ${lecture.batch.name} (${String(body.date).slice(0, 10)})`,
  });

  return { saved: records.length, present, absent: records.length - present };
};

// ---------- summaries ----------
const percent = (present, total) => (total ? Math.round((present / total) * 1000) / 10 : 0);

// Batch report: per student present / absent / percentage between two dates.
const batchSummary = async (userId, batchId, query) => {
  const actor = await getActor(userId);
  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(actor.role)) throw new HttpError(403, "Access Denied");

  const batch = await prisma.batch.findUnique({
    where: { id: Number(batchId) },
    include: { course: { select: { name: true, branchId: true } } },
  });
  if (!batch) throw new HttpError(404, "Batch not found");
  if (actor.role === "BRANCH_ADMIN" && batch.course.branchId !== actor.branchId) {
    throw new HttpError(403, "This batch belongs to another branch");
  }

  const dateFilter = {};
  if (query.from) dateFilter.gte = toDate(query.from, "from");
  if (query.to) dateFilter.lte = toDate(query.to, "to");

  const rows = await prisma.studentAttendance.findMany({
    where: { batchId: batch.id, ...(Object.keys(dateFilter).length && { date: dateFilter }) },
    select: { studentId: true, status: true },
  });
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: batch.courseId },
    select: { student: { select: { id: true, user: { select: { name: true } } } } },
  });

  const map = new Map();
  for (const e of enrollments) map.set(e.student.id, { id: e.student.id, name: e.student.user.name, present: 0, absent: 0 });
  for (const r of rows) {
    const s = map.get(r.studentId);
    if (!s) continue;
    if (r.status === "PRESENT") s.present += 1;
    else s.absent += 1;
  }

  return {
    batch: { id: batch.id, name: batch.name, course: batch.course.name },
    students: [...map.values()]
      .map((s) => ({ ...s, total: s.present + s.absent, percentage: percent(s.present, s.present + s.absent) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// One student's attendance, grouped by batch.
const studentSummary = async (studentId, { branchId, from, to } = {}) => {
  const where = { studentId: Number(studentId) };
  if (branchId) where.batch = { course: { branchId } };
  const dateFilter = {};
  if (from) dateFilter.gte = toDate(from, "from");
  if (to) dateFilter.lte = toDate(to, "to");
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const rows = await prisma.studentAttendance.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    select: {
      date: true,
      status: true,
      batch: { select: { id: true, name: true, course: { select: { name: true, branch: { select: { name: true } } } } } },
      lecture: { select: { startTime: true, endTime: true, subject: { select: { name: true } } } },
    },
  });

  const batches = new Map();
  for (const r of rows) {
    if (!batches.has(r.batch.id)) {
      batches.set(r.batch.id, {
        batchId: r.batch.id,
        batchName: r.batch.name,
        course: r.batch.course.name,
        branch: r.batch.course.branch.name,
        present: 0,
        absent: 0,
        records: [],
      });
    }
    const b = batches.get(r.batch.id);
    if (r.status === "PRESENT") b.present += 1;
    else b.absent += 1;
    b.records.push({
      date: r.date,
      status: r.status,
      subject: r.lecture.subject.name,
      startTime: r.lecture.startTime,
      endTime: r.lecture.endTime,
    });
  }

  return [...batches.values()].map((b) => ({
    ...b,
    total: b.present + b.absent,
    percentage: percent(b.present, b.present + b.absent),
  }));
};

// Student: own attendance.
const mine = async (userId, query) => {
  const student = await prisma.student.findUnique({ where: { userId: Number(userId) }, select: { id: true } });
  if (!student) throw new HttpError(404, "Student profile not found");
  return studentSummary(student.id, query);
};

// Admin: one student's attendance (branch admin sees only batches of their own branch).
const forStudent = async (userId, studentId, query) => {
  const actor = await getActor(userId);
  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(actor.role)) throw new HttpError(403, "Access Denied");
  return studentSummary(studentId, {
    ...query,
    branchId: actor.role === "BRANCH_ADMIN" ? actor.branchId : undefined,
  });
};

// ---------- reports ----------
// Which lectures can this person see? Faculty: their own. Branch admin: their branch. Super admin: all (or one branch).
const lectureScope = (actor, query) => {
  if (actor.role === "FACULTY") return { facultyId: actor.id };
  if (actor.role === "BRANCH_ADMIN") return { batch: { course: { branchId: actor.branchId } } };
  if (actor.role === "SUPER_ADMIN") {
    return query.branchId ? { batch: { course: { branchId: Number(query.branchId) } } } : {};
  }
  throw new HttpError(403, "Access Denied");
};

const parseRange = (query) => {
  const to = query.to ? toDate(query.to, "to") : todayIST();
  const from = query.from ? toDate(query.from, "from") : new Date(to.getTime() - 29 * DAY);
  if (from.getTime() > to.getTime()) throw new HttpError(400, "The from date cannot be after the to date");
  if ((to.getTime() - from.getTime()) / DAY > 366) throw new HttpError(400, "Please choose a range of at most one year");
  return { from, to };
};

const reportWhere = (actor, query) => {
  const { from, to } = parseRange(query);
  return {
    range: { from, to },
    where: {
      date: { gte: from, lte: to },
      lecture: lectureScope(actor, query),
      ...(query.batchId && { batchId: Number(query.batchId) }),
    },
  };
};

const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

// Batches to choose from in the report filter
const reportFilters = async (userId, query) => {
  const actor = await getActor(userId);
  const lectures = await prisma.lectureSchedule.findMany({
    where: lectureScope(actor, query),
    distinct: ["batchId"],
    select: {
      batch: { select: { id: true, name: true, course: { select: { name: true, branch: { select: { name: true } } } } } },
    },
  });
  return lectures
    .map((l) => ({
      id: l.batch.id,
      name: l.batch.name,
      course: l.batch.course.name,
      branch: l.batch.course.branch.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// One row per lecture and date: how many students were present and absent.
const lectureReport = async (userId, query) => {
  const actor = await getActor(userId);
  const { range, where } = reportWhere(actor, query);

  const grouped = await prisma.studentAttendance.groupBy({
    by: ["lectureId", "date", "status"],
    where,
    _count: { _all: true },
  });

  const lectureIds = [...new Set(grouped.map((g) => g.lectureId))];
  const lectures = lectureIds.length
    ? await prisma.lectureSchedule.findMany({ where: { id: { in: lectureIds } }, include: lectureInclude })
    : [];
  const byId = new Map(lectures.map((l) => [l.id, l]));

  const rows = new Map();
  for (const g of grouped) {
    const key = `${g.lectureId}|${isoDay(g.date)}`;
    if (!rows.has(key)) {
      const l = byId.get(g.lectureId);
      rows.set(key, { lecture: shapeLecture(l), lectureId: g.lectureId, date: isoDay(g.date), present: 0, absent: 0 });
    }
    const r = rows.get(key);
    if (g.status === "PRESENT") r.present += g._count._all;
    else r.absent += g._count._all;
  }

  const list = [...rows.values()]
    .map((r) => ({
      lectureId: r.lectureId,
      date: r.date,
      startTime: r.lecture.startTime,
      endTime: r.lecture.endTime,
      subject: r.lecture.subject?.name,
      faculty: r.lecture.faculty?.name,
      batch: r.lecture.batch.name,
      course: r.lecture.course.name,
      branch: r.lecture.branch?.name,
      present: r.present,
      absent: r.absent,
      total: r.present + r.absent,
      percentage: percent(r.present, r.present + r.absent),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0) || new Date(a.startTime) - new Date(b.startTime));

  const present = list.reduce((n, r) => n + r.present, 0);
  const total = list.reduce((n, r) => n + r.total, 0);
  return {
    from: isoDay(range.from),
    to: isoDay(range.to),
    rows: list,
    totals: { lectures: list.length, present, absent: total - present, total, percentage: percent(present, total) },
  };
};

// One row per student: total present, absent and percentage in the chosen dates.
const studentReport = async (userId, query) => {
  const actor = await getActor(userId);
  const { where } = reportWhere(actor, query);

  const grouped = await prisma.studentAttendance.groupBy({
    by: ["studentId", "status"],
    where,
    _count: { _all: true },
  });
  const ids = [...new Set(grouped.map((g) => g.studentId))];
  const students = ids.length
    ? await prisma.student.findMany({
        where: { id: { in: ids } },
        select: { id: true, user: { select: { name: true, phoneNumber: true } } },
      })
    : [];
  const info = new Map(students.map((s) => [s.id, s.user]));

  const map = new Map();
  for (const g of grouped) {
    if (!map.has(g.studentId)) {
      const u = info.get(g.studentId);
      map.set(g.studentId, { id: g.studentId, name: u?.name || "-", phoneNumber: u?.phoneNumber || "", present: 0, absent: 0 });
    }
    const r = map.get(g.studentId);
    if (g.status === "PRESENT") r.present += g._count._all;
    else r.absent += g._count._all;
  }
  return [...map.values()]
    .map((r) => ({ ...r, total: r.present + r.absent, percentage: percent(r.present, r.present + r.absent) }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = { reportFilters, lectureReport, studentReport, listLectures, getSheet, saveAttendance, batchSummary, mine, forStudent };
