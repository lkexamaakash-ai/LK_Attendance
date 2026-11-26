-- Student attendance (per student, per lecture, per date)
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

CREATE TABLE "StudentAttendance" (
  "id"         SERIAL PRIMARY KEY,
  "studentId"  INTEGER NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "batchId"    INTEGER NOT NULL REFERENCES "Batch"("id"),
  "lectureId"  INTEGER NOT NULL REFERENCES "LectureSchedule"("id") ON DELETE CASCADE,
  "date"       DATE NOT NULL,
  "status"     "StudentAttendanceStatus" NOT NULL,
  "markedById" INTEGER NOT NULL REFERENCES "User"("id"),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "StudentAttendance_studentId_lectureId_date_key" ON "StudentAttendance"("studentId", "lectureId", "date");
CREATE INDEX "StudentAttendance_lectureId_date_idx" ON "StudentAttendance"("lectureId", "date");
CREATE INDEX "StudentAttendance_batchId_date_idx" ON "StudentAttendance"("batchId", "date");
CREATE INDEX "StudentAttendance_studentId_idx" ON "StudentAttendance"("studentId");

ALTER TABLE "StudentAttendance" ENABLE ROW LEVEL SECURITY;
