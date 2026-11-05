"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { mainRoute } from "../apiroute";
import Audit from "../superAdmin/Models/Audit";
import StatCard from "../layout/StatCard";
import LectureOverviewChart from "../chart/LectureOverviewChart";
import {
  Activity,
  Briefcase,
  Building2,
  CircleCheck,
  GraduationCap,
  Layers,
  Presentation,
  TriangleAlert,
} from "lucide-react";

const Dash = () => {
  const [faculty, setFaculty] = useState([]);
  const [staff, setStaff] = useState([]);
  const [branch, setBranch] = useState({});
  const [lecture, setLecture] = useState([]);
  const [branchData, setBranchData] = useState({});
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let tokn = JSON.parse(localStorage.getItem("user"));
    let token = tokn.data.token;
    setBranch(tokn.data.user.branch);

    const loadData = async () => {
      const { data } = await axios.get(`${mainRoute}/api/users/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(data.data);
      const facultyData = data.data.faculty
        .filter((user) => user.role === "FACULTY")
        .filter((user) =>
            user.facultyBranches?.some(
              (item) => item.branchId === Number(tokn.data.user.branch.id),
            ),
          );
        // .filter((user) => user.facultyBranches === tokn.data.user.branch.id);

      console.log(facultyData);
      const staffData = data.data.faculty
        .filter((user) => user.role === "STAFF")
        .filter((user) => user.branchId === tokn.data.user.branch.id);
      //   const branchData = data.data.branch;

      const lectur = data.data.lectures.filter(
        (lec) => lec.batch.course.branchId === tokn.data.user.branch.id,
      );

      const bran = data.data.branch.find(
        (branc) => branc.id === tokn.data.user.branch.id,
      );

      const bat = data.data.batch.filter(
        (b) => b.course.branchId === tokn.data.user.branch.id,
      );

      setBranchData(bran);
      setFaculty(facultyData);
      setStaff(staffData);
      setLecture(lectur);
      setBatches(bat);
    };

    const fetchAuditLogs = async () => {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;

      const { data } = await axios.get(`${mainRoute}/api/audit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(data.data);
    };

    loadData();
    fetchAuditLogs();
  }, []);

  const countAttendance = (fn) =>
    lecture.reduce((count, lec) => {
      if (!Array.isArray(lec.attendance)) return count;
      return count + lec.attendance.filter(fn).length;
    }, 0);

  return (
    <>
      <div className="h-[91%] overflow-y-auto m-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid w-full grid-cols-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Branch Name" icon={Building2}>
            {branch.name}
          </StatCard>

          <StatCard label="Total Faculty" icon={GraduationCap}>
            {faculty.length}
          </StatCard>

          <StatCard label="Total Staff" icon={Briefcase} tone="gold">
            {staff.length}
          </StatCard>

          <StatCard label="Total Lectures" icon={Presentation} tone="slate">
            {lecture?.reduce((sum, lec) => sum + (lec.TotalScheduled || 0), 0)}
          </StatCard>

          <StatCard label="Lectures Conducted" icon={CircleCheck} tone="green">
            {countAttendance((att) => att.status === "CONDUCTED")}
          </StatCard>

          <StatCard label="Total Penalty" icon={TriangleAlert} tone="red">
            {countAttendance((att) => att.penalty && att.penalty !== "NONE")}
          </StatCard>

          <StatCard label="Total Batches" icon={Layers} tone="gold">
            {batches?.length || 0}
          </StatCard>

          <div
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-maroon-700 bg-gradient-to-br from-maroon-700 to-maroon-900 p-5 text-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-gold-300">
              <Activity className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-300">
                Activity Logs
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-maroon-100">
                {logs.length > 0
                  ? `${logs[0].user.name} - ${logs[0].description}`
                  : "No activity yet"}
              </p>
            </div>
          </div>
        </div>

        <LectureOverviewChart
          conducted={countAttendance((att) => att.status === "CONDUCTED")}
          missed={countAttendance((att) => att.status === "MISSED")}
          penalties={countAttendance((att) => att.penalty && att.penalty !== "NONE")}
        />
      </div>
      {open && <Audit open={open} setOpen={setOpen} logs={logs} />}
    </>
  );
};

export default Dash;
