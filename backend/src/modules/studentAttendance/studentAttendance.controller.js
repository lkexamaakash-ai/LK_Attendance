const service = require("./studentAttendance.service");

// Runs a service call and turns thrown errors into clean JSON responses.
const handle = (fn, successStatus = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    return res.status(successStatus).json({ success: true, data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("studentAttendance error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const lectures = handle((req) => service.listLectures(req.user.id, req.query));
const sheet = handle((req) => service.getSheet(req.user.id, req.query));
const save = handle((req) => service.saveAttendance(req.user.id, req.body));
const batchSummary = handle((req) => service.batchSummary(req.user.id, req.params.batchId, req.query));
const reportFilters = handle((req) => service.reportFilters(req.user.id, req.query));
const lectureReport = handle((req) => service.lectureReport(req.user.id, req.query));
const studentReport = handle((req) => service.studentReport(req.user.id, req.query));
const mine = handle((req) => service.mine(req.user.id, req.query));
const forStudent = handle((req) => service.forStudent(req.user.id, req.params.studentId, req.query));

module.exports = { reportFilters, lectureReport, studentReport, lectures, sheet, save, batchSummary, mine, forStudent };
