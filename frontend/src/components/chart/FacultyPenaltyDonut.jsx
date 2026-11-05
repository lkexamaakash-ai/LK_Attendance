"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = {
  late: "#dc2626",
  early: "#d6ac45",
  both: "#c0922f",
};

const FacultyPenaltyDonut = ({ data }) => {
  const chartData = [
    { name: "Late", value: data?.penalties?.late, color: COLORS.late },
    { name: "Early", value: data?.penalties?.early, color: COLORS.early },
    { name: "Both", value: data?.penalties?.both, color: COLORS.both },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return <p className="text-sm text-gray-500">No penalties this month 🎉</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">Penalty Breakdown</h2>

      <PieChart width={260} height={260}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
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
    </div>
  );
};

export default FacultyPenaltyDonut;
