const {
  loginUser,
  registerUser,
  bulkRegisterUser,
  registerSuperAdmin,
  changePassword,
  updatepasswordService,
  firstLoginPassword,
} = require("./auth.service");

const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        message: `phoneNumber and Password required`,
      });
    }

    const data = await loginUser(phoneNumber, password);

    res.status(200).json({
      success: true,
      message: "Login successfully",
      data,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

const register = async (req, res) => {
  try {
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
    } = req.body;

    if (!name || !phoneNumber || !role || !branchId) {
      return res.status(400).json({
        message: "Name, phoneNumber, role and branch are required",
      });
    }

    const user = await registerUser({
      name,
      phoneNumber,
      role,
      branchId,
      branchIds,
      shiftStartTime,
      shiftEndTime,
      salary,
      facultyType,
    });

    res.status(200).json({
      success: true,
      message: "User created Successfully",
      data: user,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

const AdminRegister = async (req, res) => {
  try {
    const { name, phoneNumber, password, code } = req.body;

    if (!name || !phoneNumber || !password || !code) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await registerSuperAdmin({
      name,
      phoneNumber,
      password,
      code,
    });

    res.status(200).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkRegister = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        message: "Users array is required",
      });
    }

    const result = await bulkRegisterUser(users);

    res.status(201).json({
      success: true,
      message: "Bulk User creation completed",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const changingPass = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { newPass, oldPass } = req.body;

    if (id !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only change your own password",
      });
    }

    if (!newPass || !oldPass) {
      return res.status(400).json({
        success: false,
        message: "newPass and oldPass are required",
      });
    }

    if (newPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const data = await changePassword(id, newPass, oldPass);

    // the profile pages check for data.data === "wrong pass"
    if (data.data === "wrong pass") {
      return res.json({
        success: false,
        message: "Wrong password",
        data,
      });
    }

    return res.json({
      success: true,
      message: "Password changed successfully",
      data: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const firstLoginChangePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const data = await firstLoginPassword(req.user.id, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password set successfully",
      data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const updatePass = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "userId and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const updatedUser = await updatepasswordService(userId, password);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  login,
  register,
  bulkRegister,
  AdminRegister,
  changingPass,
  updatePass,
  firstLoginChangePassword,
};
