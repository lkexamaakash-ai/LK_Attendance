const { prisma } = require("../../config/db");

const createlectureSchedule = async (
  {
    facultyId,
    subjectId,
    batchId,
    StartDate,
    EndDate,
    startTime,
    endTime,
    TotalScheduled,
  },
  currentUser,
) => {
  console.log("StartTime", startTime);
  console.log("EndTime", endTime);
  const startDateTime = new Date(startTime);
  const endDateTime = new Date(endTime);

  console.log("Date set krna", new Date(startTime));
  console.log("start Date", startDateTime);

  if (endDateTime <= startDateTime) {
    throw new Error("End time must be after start time");
  }

  // 🔹 Overlap check (same faculty + same batch + same day)
  const overlap = await prisma.lectureSchedule.findFirst({
    where: {
      facultyId,
      batchId,
      StartDate: new Date(StartDate),
      OR: [
        {
          startTime: { lt: endDateTime },
          endTime: { gt: startDateTime },
        },
      ],
    },
  });

  if (overlap) {
    throw new Error("Lecture overlaps with an existing schedule");
  }

  // 🔹 Faculty–Subject mapping (batch independent)
  const existingMapping = await prisma.facultySubject.findUnique({
    where: {
      facultyId_subjectId: {
        facultyId,
        subjectId,
      },
    },
  });

  if (!existingMapping) {
    await prisma.facultySubject.create({
      data: { facultyId, subjectId },
    });
  }

  return await prisma.lectureSchedule.create({
    data: {
      facultyId,
      subjectId,
      batchId,
      StartDate: new Date(StartDate),
      EndDate: new Date(EndDate),
      startTime: startDateTime,
      endTime: endDateTime,
      TotalScheduled: TotalScheduled ? Number(TotalScheduled) : null,
    },
  });
};

const getLectureByIdAndType = async (id, type, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  if (type === "LECTURE_BASED") {
    return await prisma.lectureSchedule.findMany({
      where: {
        facultyId: Number(id),
      },
      include: {
        attendance: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            date: "asc",
          },
        },
        subject: true,
        batch: {
          include: {
            course: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            lectureRate: true,
            facultyType: true,
          },
        },
      },
    });
  } else {
    return await prisma.facultyAttendance.findMany({
      where: {
        facultyId: Number(id),
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        faculty: true,
        batch: true,
      },
      orderBy: {
        date: "asc", // 🔥 add this
      },
    });
  }
};

const getLecture = async (id) => {
  return await prisma.lectureSchedule.findMany({
    where: {
      facultyId: Number(id),
    },
    include: {
      subject: true,
      attendance: true,

      batch: {
        select: {
          name: true,

          course: {
            select: {
              name: true,

              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const getLectureByBranchAndDate = async (batchId, date) => {
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  return await prisma.lectureSchedule.findMany({
    where: {
      batchId,
      StartDate: {
        lte: dayStart,
      },
      EndDate: {
        gte: dayEnd,
      },
    },
    include: {
      faculty: { select: { id: true, name: true } },
      subject: true,
      batch: true,
      attendance: true,
    },
    orderBy: { startTime: "asc" },
  });
};

const getAllLecture = async () => {
  return await prisma.lectureSchedule.findMany({
    orderBy: { id: "desc" },
    include: {
      subject: true,
      faculty: true,
      batch: {
        include: {
          course: {
            include: {
              branch: true,
            },
          },
          lectureSchedules: true,
        },
      },
      attendance: true,
    },
  });
};

const deleteLecture = async (id) => {
  return await prisma.lectureSchedule.delete({
    where: { id },
  });
};

const updateLecture = async (
  id,
  facultyId,
  subjectId,
  batchId,
  StartDate,
  EndDate,
  startTime,
  endTime,
  TotalScheduled,
) => {
  return await prisma.lectureSchedule.update({
    where: { id },
    data: {
      facultyId,
      subjectId,
      batchId,
      StartDate: new Date(StartDate),
      EndDate: new Date(EndDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      TotalScheduled: TotalScheduled ? Number(TotalScheduled) : null,
    },
  });
};

function mergeDateAndTime(date, time) {
  const d = new Date(date);

  const [hours, minutes] = time.split(":").map(Number);

  d.setHours(hours, minutes, 0, 0);

  return d;
}

const resetLectureCycleService = async ({
  lectureId,
  startDate,
  endDate,
  startTime,
  endTime,
  totalScheduled,
}) => {
  const oldLecture = await prisma.lectureSchedule.findUnique({
    where: {
      id: lectureId,
    },
  });

  if (!oldLecture) {
    throw new Error("Lecture schedule not found");
  }

  const startTimeDate = mergeDateAndTime(startDate, startTime);
  const endTimeDate = mergeDateAndTime(startDate, endTime);

  if (startTimeDate >= endTimeDate) {
    throw new Error("End time must be after start time");
  }

  const subject = await prisma.subject.update({
    where: {
      id: oldLecture.subjectId,
    },
    data: {
      cycleCount: {
        increment: 1,
      },
    },
  });

  const newLecture = await prisma.lectureSchedule.create({
    data: {
      facultyId: oldLecture.facultyId,
      subjectId: oldLecture.subjectId,
      batchId: oldLecture.batchId,

      StartDate: new Date(startDate),
      EndDate: new Date(endDate),

      startTime: startTimeDate,
      endTime: endTimeDate,
      cycleCount: subject.cycleCount,
      TotalScheduled: Number(totalScheduled),
    },
  });

  return newLecture;
};

const deleteFacultyAttendance = async (id) => {
  const attendance = await prisma.lectureAttendance.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!attendance) {
    throw new Error("Faculty attendance not found");
  }

  await prisma.lectureAttendance.delete({
    where: {
      id: Number(id),
    },
  });

  return {
    success: true,
    message: "Faculty attendance deleted successfully",
  };
};

module.exports = {
  createlectureSchedule,
  getLectureByBranchAndDate,
  getAllLecture,
  deleteLecture,
  updateLecture,
  getLectureByIdAndType,
  getLecture,
  resetLectureCycleService,
  deleteFacultyAttendance,
};
