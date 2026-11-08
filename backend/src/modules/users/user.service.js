const { prisma } = require("../../config/db");

const assignUserToBranch = async (userId, branchId, currentUser) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  if (currentUser.role === "BRANCH_ADMIN") {
    if (branchId !== currentUser.branchId) {
      throw new Error("You can assign users only to your branch");
    }
    if (user.role === "SUPER_ADMIN") {
      throw new Error("Not allowed");
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { branchId },
  });
};

const bulkAssignUsersToBranch = async (userIds, branchId, currentUser) => {
  const updated = [];
  const errors = [];

  for (const id of userIds) {
    try {
      const user = await assignUserToBranch(id, branchId, currentUser);
      updated.push(user.id);
    } catch (err) {
      errors.push({ userId: id, message: err.message });
    }
  }

  return { updated, errors };
};

const getUsersByBranch = async (branchId, currentUser) => {
  if (
    currentUser.role === "BRANCH_ADMIN" &&
    currentUser.branchId !== branchId
  ) {
    throw new Error("Access Denied");
  }

  return await prisma.user.findMany({
    where: { branchId },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      role: true,
      branchId: true,
      createdAt: true,
    },
  });
};

const getAllUser = async () => {
  return await prisma.user.findMany({
    where: { role: { not: "STUDENT" } },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      branchId: true,
      branch: {
        include: {
          users: true,
        },
      },
      facultySubjects: {
        include: {
          subject: true,
        },
      },
      facultyBranches: {
        include: {
          branch: true,
        },
      },

      shiftStartTime: true,
      shiftEndTime: true,
      lectures: {
        include: {
          attendance: true,
          subject: true,
          batch: {
            include: {
              course: {
                include: {
                  branch: true,
                },
              },
            },
          },
        },
      },
      staffAttendances: true,
      salary: true,
      facultyType: true,
      lectureRate: true,
      workingMinutesPerDay: true,
      isActive: true,
    },
  });
};

const makeBrancheAdmin = async (userId, branchId) => {
  // 1️⃣ Branch fetch karo
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  console.log(branch);
  if (!branch) {
    throw new Error("Branch not found");
  }

  console.log(branch.userId);
  // 2️⃣ Agar branch pe pehle se admin hai → usko revert karo
  if (branch.userId) {
    console.log("Branch user", branch.userId);
    const oldAdmin = await prisma.user.findUnique({
      where: { id: branch.userId },
      select: {
        previousRole: true,
      },
    });

    const restoreRole = oldAdmin?.previousRole || "STAFF";

    await prisma.user.update({
      where: { id: branch.userId }, // ✅ FIXED
      data: {
        role: restoreRole,
        previousRole: null,
      },
    });
  }

  // 3️⃣ New user fetch
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  console.log("user", user);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new Error("Cannot change super admin role");
  }

  // 4️⃣ New admin bana do
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: "BRANCH_ADMIN",
      previousRole: user.role,
      branchId,
    },
  });

  console.log("Updated User", updatedUser);

  // 5️⃣ Branch ko naye admin se link karo
  const newAdmin = await prisma.branch.update({
    where: { id: branchId },
    data: {
      userId: userId,
    },
  });
  console.log("New Admin", newAdmin);

  return updatedUser;
};

const updateUser = async (
  id,
  name,
  phoneNumber,
  role,
  branchId,
  salary,
  shiftStartTime,
  shiftEndTime,
  facultyType,
  branchIds,
) => {
  console.log({
    id,
    role,
    branchId,
    branchIds,
  });
  if (role === "STAFF") {
    const today = new Date().toISOString().split("T")[0];

    const shiftStart = new Date(`${today}T${shiftStartTime}`);
    const shiftEnd = new Date(`${today}T${shiftEndTime}`);

    const workingMinutesPerDay = Math.floor(
      (shiftEnd - shiftStart) / (1000 * 60),
    );

    return await prisma.user.update({
      where: { id },
      data: {
        name,
        phoneNumber,
        role,
        branchId: Number(branchId),
        shiftStartTime: shiftStart,
        shiftEndTime: shiftEnd,
        salary: Number(salary),
        workingMinutesPerDay: workingMinutesPerDay,
      },
    });
  } else {
    if (facultyType === "SALARY_BASED") {
      const today = new Date().toISOString().split("T")[0];

      const shiftStart = new Date(`${today}T${shiftStartTime}`);
      const shiftEnd = new Date(`${today}T${shiftEndTime}`);

      const workingMinutesPerDay = Math.floor(
        (shiftEnd - shiftStart) / (1000 * 60),
      );

      const user = await prisma.user.update({
        where: { id },
        data: {
          name,
          phoneNumber,
          role,
          branchId: null,
          salary: Number(salary),
          shiftEndTime: shiftEnd,
          shiftStartTime: shiftStart,
          workingMinutesPerDay: workingMinutesPerDay,
        },
      });
      await prisma.facultyBranch.deleteMany({
        where: {
          facultyId: id,
        },
      });

      await prisma.facultyBranch.createMany({
        data: branchIds.map((branchId) => ({
          facultyId: id,
          branchId: Number(branchId),
        })),
        skipDuplicates: true,
      });

      return user;
    } else {
      const user = await prisma.user.update({
        where: { id },
        data: {
          name,
          phoneNumber,
          role,
          branchId: null,
          lectureRate: Number(salary),
        },
      });

      await prisma.facultyBranch.deleteMany({
        where: {
          facultyId: id,
        },
      });

      await prisma.facultyBranch.createMany({
        data: branchIds.map((branchId) => ({
          facultyId: id,
          branchId: Number(branchId),
        })),
        skipDuplicates: true,
      });

      return user;
    }
  }
};

const deleteUser = async (id) => {
  return await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      isActive: false,
    },
  });
};

const branchDashboard = async () => {
  const branch = await prisma.branch.findMany({
    include: {
      courses: {
        include: {
          batches: {
            include: {
              lectureSchedules: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          createdAt: true,
          branch: true,
          branchId: true,
          facultyType: true,
          lectureRate: true,
          salary: true,
          staffAttendances: true,
          previousRole: true,
          role: true,
          shiftEndTime: true,
          shiftStartTime: true,
          workingMinutesPerDay: true,
        },
      },
      staffAttendances: true,
    },
  });

  const faculty = await prisma.user.findMany({
    where: { role: { not: "STUDENT" } },
    include: {
      facultySubjects: {
        include: { subject: true },
      },
      lectures: {
        include: { attendance: true, batch: true },
      },
      branch: true,
      staffAttendances: true,
      facultyBranches: true,
    },
  });

  const lectures = await prisma.lectureSchedule.findMany({
    include: {
      faculty: true,
      subject: true,
      batch: {
        include: {
          course: true,
        },
      },
      attendance: true,
    },
  });

  const batch = await prisma.batch.findMany({
    include: {
      course: true,
      lectureSchedules: true,
      subjects: true,
    },
  });

  return {
    branch,
    faculty,
    lectures,
    batch,
  };
};

const userDashboard = async ({ branchId, userId }) => {
  let branch;
  if (branchId) {
    branch = await prisma.branch.findMany({
      where: {
        id: branchId,
      },
      include: {
        courses: {
          include: {
            batches: {
              include: {
                lectureSchedules: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            role: true,
            branchId: true,
          },
        },
        staffAttendances: true,
      },
    });
  }

  const faculty = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      facultySubjects: {
        include: {
          subject: true,
        },
      },
      lectures: {
        include: {
          attendance: true,
          batch: true,
        },
      },
      branch: true,
      staffAttendances: true,
      facultyBranches: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (!branchId) {
    if (faculty.role === "FACULTY") {
      branch = faculty.facultyBranches.map((fb) => fb.branch);
    } else {
      branch = faculty.branch ? [faculty.branch] : [];
    }
  }

  const branchIds = branchId
    ? [branchId]
    : faculty.role === "FACULTY"
      ? faculty.facultyBranches.map((fb) => fb.branchId)
      : faculty.branchId
        ? [faculty.branchId]
        : [];

  const lectures = await prisma.lectureSchedule.findMany({
    where: {
      facultyId: userId,
      batch: {
        course: {
          branchId: {
            in: branchIds,
          },
        },
      },
    },
    include: {
      faculty: true,
      subject: true,
      batch: {
        include: {
          course: {
            include: {
              branch: true,
            },
          },
        },
      },
      attendance: true,
    },
  });

  // const batch = await prisma.batch.findMany({
  //   where:{
  //     branchId
  //   },
  //   include: {
  //     course: true,
  //     lectureSchedules: true,
  //     subjects: true,
  //   },
  // });

  return {
    branch,
    faculty,
    lectures,
    // batch,
  };
};

const activateUser = async (id) => {
  return await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      isActive: true,
    },
  });
};

module.exports = {
  assignUserToBranch,
  bulkAssignUsersToBranch,
  getUsersByBranch,
  makeBrancheAdmin,
  getAllUser,
  branchDashboard,
  updateUser,
  deleteUser,
  userDashboard,
  activateUser,
};
