const express = require("express");
const router = express.Router();
const {
  login,
  register,
  bulkRegister,
  AdminRegister,
  changingPass,
  updatePass,
  firstLoginChangePassword,
} = require("./auth.controller");
const {
  protect,
  protectAllowPasswordPending,
} = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

// Only a super admin can create users (in any branch)
router.post("/register", protect, requireRole("SUPER_ADMIN"), register);
router.post(
  "/register/bulk",
  protect,
  requireRole("SUPER_ADMIN"),
  bulkRegister,
);

router.post("/register_super", AdminRegister);
router.post("/login", login);

router.put("/changepass/:id", protect, changingPass);

// Used right after the first login with the default password
router.put(
  "/first-login-password",
  protectAllowPasswordPending,
  firstLoginChangePassword,
);

router.put("/update-password", protect, requireRole("SUPER_ADMIN"), updatePass);

module.exports = router;
