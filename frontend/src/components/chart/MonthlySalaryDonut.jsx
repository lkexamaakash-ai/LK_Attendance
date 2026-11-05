"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = {
  net: "#16a34a", // green
  late: "#dc2626", // red
  extra: "#d6ac45", // orange
  overtime: "#8a2a3e", // blue
};

const MonthlySalaryDonut = ({ data }) => {
  const extraPay = Math.floor(data?.breakdown?.extraPay).toString();
  console.log(data);
  const chartData = [
    {
      name: "Net Pay",
      value: data?.netPay,
      color: COLORS.net,
    },
    {
      name: "Late Penalty",
      value: data?.breakdown?.fixedLatePenalties,
      color: COLORS.late,
    },
    {
      name: "Extra Penalty",
      value: data?.breakdown?.totalExtaPenalties,
      color: COLORS.extra,
    },
    {
      name: "Overtime Pay",
      value: data?.breakdown?.totalOvertimePay,
      color: COLORS.overtime,
    },
  ].filter((d) => d.value > 0);

  const monthName = new Date(data.year, data.month - 1).toLocaleString(
    "en-IN",
    { month: "long" },
  );

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">
        Salary Breakdown – {monthName} 
      </h2>

      <PieChart width={320} height={320}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>

      {/* Center Text */}
      <div className="flex justify-around w-full">
        <div className="text-center mt-3">
          <p className="text-sm text-gray-500">Leave Pay</p>
          <p
            className={`text-2xl font-bold ${data?.breakdown?.extraPay > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {data?.breakdown?.extraPay>0 ? extraPay.padStart(extraPay.length+1,"₹") : Math.floor(data?.breakdown?.extraPay).toString().split("-").join("-₹") || 0}
          </p>
        </div>
        <div className="text-center mt-3">
          <p className="text-sm text-gray-500">Net Pay</p>
          <p className="text-2xl font-bold text-green-600">₹{data.netPay}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlySalaryDonut;
