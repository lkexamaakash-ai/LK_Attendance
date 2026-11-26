const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const controller = require("./studentAttendance.controller");

const markers = requireRole("SUPER_ADMIN", "BRANCH_ADMIN", "FACULTY");
const admins = requireRole("SUPER_ADMIN", "BRANCH_ADMIN");

// Marking: lectures of a date, the student sheet for a lecture, and saving it
router.get("/lectures", protect, markers, controller.lectures);
router.get("/sheet", protect, markers, controller.sheet);
router.post("/", protect, markers, controller.save);

// Reports
router.get("/batch/:batchId/summary", protect, admins, controller.batchSummary);
router.get("/me", protect, requireRole("STUDENT"), controller.mine);
router.get("/student/:studentId", protect, admins, controller.forStudent);

module.exports = router;
