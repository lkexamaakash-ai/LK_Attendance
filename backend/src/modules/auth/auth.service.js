const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../../config/db");

const getDefaultPassword = () => {
  const pass = process.env.DEFAULT_PASSWORD;
  if (!pass) {
    throw new Error("DEFAULT_PASSWORD is not configured on the server");
  }
  return pass;
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// The four login choices on the login screen and the account roles each one accepts.
const LOGIN_TYPES = {
  STUDENT: { label: "Student", roles: ["STUDENT"] },
  STAFF: { label: "Staff", roles: ["STAFF"] },
  FACULTY: { label: "Faculty", roles: ["FACULTY"] },
  BRANCH: { label: "Branch / Admin", roles: ["BRANCH_ADMIN", "SUPER_ADMIN"] },
};
const typeOfRole = (role) => Object.keys(LOGIN_TYPES).find((k) => LOGIN_TYPES[k].roles.includes(role));

class LoginError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const loginUser = async (phoneNumber, password, loginAs) => {
  if (loginAs && !LOGIN_TYPES[loginAs]) {
    throw new LoginError(400, "Please choose a valid login type");
  }

  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    include: {
      branch: true,
      facultyBranches: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (!user) {
    throw new LoginError(401, "Invalid phone number or password");
  }

  const now = new Date();

  // Locked after too many wrong passwords
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
    throw new LoginError(429, `Too many wrong attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const previous = user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLoginAttempts || 0;
    const attempts = previous + 1;

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) },
      });
      throw new LoginError(429, `Too many wrong attempts. This account is locked for ${LOCK_MINUTES} minutes.`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil: null },
    });
    const left = MAX_FAILED_ATTEMPTS - attempts;
    throw new LoginError(
      401,
      left <= 2
        ? `Invalid phone number or password. ${left} attempt${left === 1 ? "" : "s"} left before this account is locked.`
        : "Invalid phone number or password",
    );
  }

  // Correct password: clear any earlier failed attempts
  if (user.failedLoginAttempts || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  if (!user.isActive) {
    throw new LoginError(403, "Not allowed to login");
  }

  // The chosen login type must match the account
  if (loginAs && !LOGIN_TYPES[loginAs].roles.includes(user.role)) {
    const right = LOGIN_TYPES[typeOfRole(user.role)];
    throw new LoginError(
      403,
      `This is a ${right.label} account. Please choose "${right.label}" login.`,
    );
  }

  const token = signToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      branchId: user.branchId,
      branch: user.branch,
      type: user.facultyType,
      mustChangePassword: user.mustChangePassword,
    },
  };
};

const registerSuperAdmin = async (data) => {
  const { name, phoneNumber, password, code } = data;

  const expectedCode = process.env.CODE ?? process.env.code;

  if (!expectedCode || expectedCode !== code) {
    throw new Error("You are not authorized to register");
  }

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (existingUser) {
    throw new Error(`User already exists with this phoneNumber`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phoneNumber,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      branchId: null,
    },
  });

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      branchId: user.branchId,
    },
  };
};

const registerUser = async (data) => {
  const {
    name,
    phoneNumber,
    role,
    branchId,
    branchIds,
    shiftStartTime,
    shiftEndTime,
    salary,
    facultyType,
  } = data;

  // const today = new Date().toISOString().split("T")[0];

  // const shiftStart = new Date(`${today}T${shiftStartTime}`);
  // const shiftEnd = new Date(`${today}T${shiftEndTime}`);

  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (existingUser) {
    throw new Error(`User already exists with this phoneNumber`);
  }

  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);

  const today = new Date().toISOString().split("T")[0];
  console.log(today);

  const shiftStart = shiftStartTime
    ? new Date(`${today}T${shiftStartTime}`)
    : null;
  const shiftEnd = shiftEndTime ? new Date(`${today}T${shiftEndTime}`) : null;
  console.log(shiftStart);
  console.log(shiftEnd);

  if (role === "STAFF") {
    if (!shiftStart || !shiftEnd) {
      throw new Error("Shift timings required for staff");
    }
    const workingMinutesPerDay = Math.floor(
      (shiftEnd - shiftStart) / (1000 * 60),
    );

    if (workingMinutesPerDay <= 0) {
      throw new Error("InValid shift timings");
    }
    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        password: hashedPassword,
        mustChangePassword: true,
        role,
        branchId: branchId || null,
        shiftStartTime: new Date(shiftStart.toISOString()),
        shiftEndTime: new Date(shiftEnd.toISOString()),
        salary: Number(salary),
        workingMinutesPerDay,
      },
    });
    return {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      branchId: user.branchId,
      shiftStartTime: user.shiftStartTime,
      shiftEndTime: user.shiftEndTime,
      salary: Number(salary),
    };
  } else {
    if (facultyType === "SALARY_BASED") {
      if (!shiftStart || !shiftEnd) {
        throw new Error("Shift timings required for salary based faculty");
      }
      const workingMinutesPerDay = Math.floor(
        (shiftEnd - shiftStart) / (1000 * 60),
      );

      if (workingMinutesPerDay <= 0) {
        throw new Error("InValid shift timings");
      }

      const user = await prisma.user.create({
        data: {
          name,
          phoneNumber,
          password: hashedPassword,
          mustChangePassword: true,
          role,
          branchId: null,
          facultyType,
          shiftStartTime: new Date(shiftStart.toISOString()),
          shiftEndTime: new Date(shiftEnd.toISOString()),
          salary: Number(salary),
        },
      });

      if (branchIds.length > 0) {
        await prisma.facultyBranch.createMany({
          data: branchIds.map((id) => ({
            facultyId: user.id,
            branchId: Number(id),
          })),
          skipDuplicates: true,
        });
      }

      return {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        branchId: user.branchId,
        facultyType: user.facultyType,
        salary: user.salary,
      };
    } else {
      const user = await prisma.user.create({
        data: {
          name,
          phoneNumber,
          password: hashedPassword,
          mustChangePassword: true,
          role,
          branchId: null,
          facultyType,
          lectureRate: salary ? Number(salary) : null,
        },
      });

      if (branchIds.length > 0) {
        await prisma.facultyBranch.createMany({
          data: branchIds.map((id) => ({
            facultyId: user.id,
            branchId: Number(id),
          })),
          skipDuplicates: true,
        });
      }
      return {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        branchId: user.branchId,
        facultyType: user.facultyType,
        lectureRate: user.lectureRate,
      };
    }
  }
};

const changePassword = async (id, newPass, oldPass) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User Not found");
  }

  const comparePass = await bcrypt.compare(oldPass, user.password);

  if (!comparePass) {
    return {
      data: "wrong pass",
    };
  }

  const hashpass = await bcrypt.hash(newPass, 10);
  const updated = await prisma.user.update({
    where: {
      id,
    },
    data: {
      password: hashpass,
      mustChangePassword: false,
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    phoneNumber: updated.phoneNumber,
    role: updated.role,
  };
};

const bulkRegisterUser = async (users) => {
  const createdUser = [];
  const errors = [];
  const hashedPassword = await bcrypt.hash(getDefaultPassword(), 10);
  const validRoles = ["SUPER_ADMIN", "BRANCH_ADMIN", "FACULTY", "STAFF"];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const { name, phoneNumber, role, branchId } = user;

    try {
      if (!name || !phoneNumber || !role) {
        throw new Error("name, phoneNumber and role are required");
      }

      if (!validRoles.includes(role)) {
        throw new Error("Invalid role");
      }

      const exists = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (exists) {
        throw new Error(`phoneNumber already exists`);
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          phoneNumber,
          password: hashedPassword,
          mustChangePassword: true,
          role,
          branchId: branchId || null,
        },
      });

      createdUser.push({
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      });
    } catch (err) {
      errors.push({
        phoneNumber,
        message: err.message,
      });
    }
  }

  return { createdUser, errors };
};

const updatepasswordService = async (userId, password) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  });

  if (!user) {
    throw new Error("User Not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await prisma.user.update({
    where: {
      id: Number(userId),
    },
    data: {
      password: hashedPassword,
    },
  });

  return updatedUser;
};

const firstLoginPassword = async (userId, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) {
    throw new Error("User Not found");
  }

  if (!user.mustChangePassword) {
    throw new Error("Password change on first login is not required");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  if (newPassword === getDefaultPassword()) {
    throw new Error("New password cannot be the default password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  return {
    token: signToken(updated),
    user: {
      id: updated.id,
      name: updated.name,
      phoneNumber: updated.phoneNumber,
      role: updated.role,
      branchId: updated.branchId,
      mustChangePassword: updated.mustChangePassword,
    },
  };
};

module.exports = {
  firstLoginPassword,
  loginUser,
  registerUser,
  bulkRegisterUser,
  registerSuperAdmin,
  changePassword,
  updatepasswordService
};
