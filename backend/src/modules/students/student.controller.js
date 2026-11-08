const service = require("./student.service");

// Runs a service call and turns thrown errors into clean JSON responses.
const handle = (fn, successStatus = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    return res.status(successStatus).json({ success: true, data });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("students error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const create = handle((req) => service.createStudent(req.user.id, req.body), 201);
const bulkCreate = handle((req) => service.bulkCreateStudents(req.user.id, req.body), 201);
const list = handle((req) => service.listStudents(req.user.id, req.query));
const me = handle((req) => service.getMe(req.user.id));
const getOne = handle((req) => service.getProfile(req.user.id, req.params.id));
const update = handle((req) => service.updateStudent(req.user.id, req.params.id, req.body));
const updateEnrollment = handle((req) =>
  service.updateEnrollment(req.user.id, req.params.id, req.params.enrollmentId, req.body),
);

module.exports = { create, bulkCreate, list, me, getOne, update, updateEnrollment };
