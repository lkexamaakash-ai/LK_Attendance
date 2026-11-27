const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const controller = require("./student.controller");

const admins = requireRole("SUPER_ADMIN", "BRANCH_ADMIN");

// Branches and courses an admin can choose from (super admin: all branches, branch admin: own branch)
router.get("/options", protect, admins, controller.options);

// Admin: add students (super admin: any branch, branch admin: own branch only)
router.post("/", protect, admins, controller.create);
router.post("/bulk", protect, admins, controller.bulkCreate);
router.post("/bulk-courses", protect, admins, controller.bulkAssignCourses);
router.post("/assign-courses", protect, admins, controller.assignCourses);
router.get("/ids", protect, admins, controller.ids);
router.get("/", protect, admins, controller.list);

// Student: own profile (must come before "/:id")
router.get("/me", protect, requireRole("STUDENT"), controller.me);

// Profile: admins of the right branch, or the student themselves (checked in the service)
router.get("/:id", protect, requireRole("SUPER_ADMIN", "BRANCH_ADMIN", "STUDENT"), controller.getOne);
router.put("/:id", protect, admins, controller.update);
router.delete("/:id", protect, admins, controller.remove);

// Courses of a student (add, change dates, remove)
router.put("/:id/enrollments", protect, admins, controller.setEnrollments);

module.exports = router;
