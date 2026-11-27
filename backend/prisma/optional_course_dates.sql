-- Course start / end dates become optional
ALTER TABLE "Enrollment" ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "endDate" DROP NOT NULL;
