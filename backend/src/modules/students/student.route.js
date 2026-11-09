const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const controller = require("./student.controller");

const admins = requireRole("SUPER_ADMIN", "BRANCH_ADMIN");

// Admin: add students (super admin: any branch, branch admin: own branch only)
router.post("/", protect, admins, controller.create);
router.post("/bulk", protect, admins, controller.bulkCreate);
router.get("/", protect, admins, controller.list);

// Student: own profile (must come before "/:id")
router.get("/me", protect, requireRole("STUDENT"), controller.me);

// Profile: admins of the right branch, or the student themselves (checked in the service)
router.get("/:id", protect, requireRole("SUPER_ADMIN", "BRANCH_ADMIN", "STUDENT"), controller.getOne);
router.put("/:id", protect, admins, controller.update);
router.put("/:id/enrollments/:enrollmentId", protect, admins, controller.updateEnrollment);

// Payments for a course period
router.post("/:id/enrollments/:enrollmentId/payments", protect, admins, controller.addPayment);
router.delete("/:id/enrollments/:enrollmentId/payments/:paymentId", protect, admins, controller.removePayment);

module.exports = router;
