"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = {
  conducted: "#16a34a",
  missed: "#dc2626",
  cancelled: "#d6ac45",
  remaining: "#8a2a3e",
};

const FacultyLectureStatusDonut = ({ data }) => {
  console.log(data)
  const chartData = [
    { name: "Conducted", value: data?.conducted, color: COLORS.conducted },
    { name: "Pre cancelled", value: data?.missed, color: COLORS.missed },
    { name: "Cancelled", value: data?.cancelled, color: COLORS.cancelled },
    {
      name: "Remaining",
      value: data?.remainingLectures,
      color: COLORS.remaining,
    },
  ].filter((d) => d.value > 0);

  const monthName = new Date(data?.year, data?.month - 1).toLocaleString(
    "en-IN",
    { month: "long" }
  );

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">
        Lecture Status – {monthName} {data?.year}
      </h2>

      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>

      <p className="mt-2 text-sm text-gray-600">
        Conducted Lectures: <b>{data?.conducted}</b>
      </p>
    </div>
  );
};

export default FacultyLectureStatusDonut;
