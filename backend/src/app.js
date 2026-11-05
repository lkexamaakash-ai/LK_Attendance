const dotenv = require("dotenv");
dotenv.config({ quiet: true });
const express = require("express");
const cors = require("cors");
const app = express();
const authRoute = require("./modules/auth/auth.routes");
const branchRoute = require("./modules/branch/branch.route");
const userRoute = require("./modules/users/user.route");
const subjectRoute = require("./modules/subjects/subject.route");
const lectureRoute = require("./modules/lectures/lectures.route");
const facultyAttRoute = require("./modules/attendance/attendance.route");
const staffAttendanceRoute = require("./modules/staffAttendance/staffAttendance.route");
const batchRoutes = require("./modules/batch/batch.route");
const coursesRoute = require("./modules/courses/courses.route");
const uploadRoute = require("./modules/upload/upload.route");
const uploadStaffRoute = require("./modules/staffUpload/staffUpload.route");
const generateReportRoute = require("./modules/report/report.route");
const auditRoute = require("./modules/audit/audit.route");
const morgan = require("morgan");

app.use(morgan("dev"));

// Extra allowed frontend addresses, comma separated (e.g. https://my-site.vercel.app)
const extraOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://lk-academy.vercel.app",
      ...extraOrigins,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoute);
app.use("/api/branch", branchRoute);
app.use("/api/users", userRoute);
app.use("/api/subject", subjectRoute);
app.use("/api/lecture", lectureRoute);
app.use("/api/attendance", facultyAttRoute);
app.use("/api/staffAttendance", staffAttendanceRoute);
app.use("/api/batch", batchRoutes);
app.use("/api/courses", coursesRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/uploadStaff", uploadStaffRoute);
app.use("/api/report", generateReportRoute);
app.use("/api/audit",auditRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server up and running",
  });
});

module.exports = app;
