"use client";

import { BarChart, Bar, XAxis, Tooltip } from "recharts";

const FacultyAttendanceBar = ({ data }) => {
  const chartData = [
    { name: "Working Days", value: data.workingDays },
    { name: "Leave Days", value: data.leaveDays },
  ];

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">Attendance Summary</h2>

      <BarChart width={260} height={200} data={chartData}>
        <XAxis dataKey="name" />
        <Tooltip />
        <Bar dataKey="value" fill="#8a2a3e" />
      </BarChart>
    </div>
  );
};

export default FacultyAttendanceBar;
