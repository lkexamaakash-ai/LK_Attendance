-- Students are enrolled in COURSES (not batches), and all fee / payment tables are removed.

BEGIN;

-- 1) Enrollment: batch -> course
ALTER TABLE "Enrollment" ADD COLUMN "courseId" INTEGER;
UPDATE "Enrollment" e SET "courseId" = b."courseId" FROM "Batch" b WHERE b."id" = e."batchId";

-- if a student had the same course in two batches / periods, keep the one that ends last
DELETE FROM "Enrollment" a USING "Enrollment" b
 WHERE a."studentId" = b."studentId" AND a."courseId" = b."courseId"
   AND (a."endDate" < b."endDate" OR (a."endDate" = b."endDate" AND a."id" < b."id"));

ALTER TABLE "Enrollment" ALTER COLUMN "courseId" SET NOT NULL;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- 2) Remove payments, installments and fee columns
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "Installment";
ALTER TABLE "Enrollment" DROP COLUMN "batchId";
ALTER TABLE "Enrollment" DROP COLUMN "totalFee";
ALTER TABLE "Enrollment" DROP COLUMN "planType";
ALTER TABLE "Enrollment" DROP COLUMN "balanceDueDate";
DROP TYPE IF EXISTS "PaymentPlan";
DROP TYPE IF EXISTS "PaymentMode";

COMMIT;
