import { mainRoute } from "@/components/apiroute";
import FacultyAttendanceBar from "@/components/chart/FacultyAttendanceBar";
import FacultyLectureStatusDonut from "@/components/chart/FacultyLectureStatusDonut";
import FacultyPenaltyDonut from "@/components/chart/FacultyPenaltyDonut";
import MonthlySalaryDonut from "@/components/chart/MonthlySalaryDonut";
import SalaryBasedFacultyDonut from "@/components/chart/SalaryBasedFacultyDonut";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import SelectBranchModels from "./SelectBranchModels";
import AllAttendance from "./AllAttendance";

const ReportModels = ({ open, setOpen, user, setUser }) => {
  const [oping, setOping] = useState(false);
  const [opn, setOpn] = useState(false);

  const list = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let cYear = new Date().getFullYear();

  const years = Array.from(
    {
      length: cYear - 2024 + 1,
    },
    (_, i) => 2024 + i,
  );

  const [chartData, setChartData] = useState({});
  const [currentMon, setCurrentMon] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user?.id) return;
    let tok = JSON.parse(localStorage.getItem("user")).data.token;
    let facultyRole = user?.role;
    const fetchMonthlyStaff = async () => {
      if (facultyRole === "STAFF") {
        const { data } = await axios.get(
          `${mainRoute}/api/staffAttendance/report/salary-summary/${
            user?.id
          }?month=${currentMon + 1}&year=${currentYear}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tok}`,
            },
          },
        );
        setChartData(data.data);
      } else if (facultyRole === "FACULTY") {
        if (user?.facultyType === "LECTURE_BASED") {
          const { data } = await axios.get(
            `${mainRoute}/api/attendance/faculty/${
              user?.id
            }/monthly-summary?month=${currentMon + 1}&year=${currentYear}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tok}`,
              },
            },
          );
          setChartData(data.data);
        } else {
          const { data } = await axios.get(
            `${mainRoute}/api/attendance/faculty/salary-summary/${
              user?.id
            }?month=${currentMon + 1}&year=${currentYear}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tok}`,
              },
            },
          );
          setChartData(data.data);
        }
      }
    };
    fetchMonthlyStaff();
  }, [user, currentMon, currentYear]);

  const handleSendWhatsappMsg = () => {
    const message = `
*Staff Monthly Summary*

*Name*: ${user.name}
*Branch*: ${user.branch.name}
*Month*: ${new Date(currentYear, currentMon).toLocaleString("en-IN", {
      month: "long",
    })}

*Late Penalty*: ${chartData?.breakdown?.fixedLatePenalties}
*Work Hour Shortfall Deduction*: ${chartData?.breakdown?.totalExtaPenalties}
*Overtime Compensation*: ${chartData?.breakdown?.totalOvertimePay}

*Net Salary for the Monthy*: ${chartData?.netPay}
  `.trim();

    const whatsappURL = `https://wa.me/${
      user.phoneNumber
    }/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-auto p-5 md:w-[60vw] lg:w-[40vw] bg-white shadow-2xl rounded-2xl border border-stone-200  ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => {
                  setOpen(false);
                  setUser({});
                }}
              >
                ✕
              </span>
            </div>

            <div className="w-full">
              <div className="flex gap-4 border-b-2 pb-2">
                <Select
                  value={currentMon}
                  onValueChange={(v) => setCurrentMon(v)}
                >
                  <SelectTrigger className={`w-45`}>
                    <SelectValue placeholder={"Role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((item, i) => (
                      <SelectItem key={i} value={i}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentYear}
                  onValueChange={(v) => setCurrentYear(v)}
                >
                  <SelectTrigger className={`w-45`}>
                    <SelectValue placeholder={"Year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((item, i) => (
                      <SelectItem key={i} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {user?.role === "STAFF" && (
              <div className="">
                <MonthlySalaryDonut data={chartData} />
              </div>
            )}

            {user?.role === "FACULTY" &&
              (user?.facultyType === "LECTURE_BASED" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FacultyLectureStatusDonut data={chartData} />
                    <FacultyPenaltyDonut data={chartData} />
                  </div>
                  <h3 className="text-xl font-semibold mt-4 text-green-600">
                    Total Payout: ₹{chartData.totalPayout}
                  </h3>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SalaryBasedFacultyDonut data={chartData} />
                    <FacultyAttendanceBar data={chartData} /> {/* optional */}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <p>Per Day Salary: ₹{chartData?.perDaySalary}</p>
                    <p>
                      Avg Daily Minutes:{" "}
                      {chartData.attendanceSummary?.averageDailyMinutes} mins
                    </p>
                    <p>
                      Total Working Minutes:{" "}
                      {chartData.attendanceSummary?.totalWorkingMinutes}
                    </p>
                    <p>Total Days: {chartData?.totalDays}</p>
                  </div>
                </>
              ))}
            <div className="w-full gap-2 flex justify-center items-center">
              <Button
                onClick={
                  user?.role === "STAFF"
                    ? handleSendWhatsappMsg
                    : () => setOping(true)
                }
                className={`w-1/2 mt-5 cursor-pointer bg-maroon-700 text-white hover:bg-maroon-800 mx-auto`}
              >
                <Image
                  src={"/whatsapp.png"}
                  alt="whatsapp"
                  height={100}
                  width={100}
                  className="h-5 w-5"
                />
                Whatsapp
              </Button>
              <Button
                onClick={() => {
                  setOpn(true);
                }}
                className={`w-1/2 mt-5 cursor-pointer bg-[#8a2a3e] hover:bg-[#a85e5ae1]`}
              >
                Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
      <SelectBranchModels
        list={list}
        currentMon={currentMon}
        open={oping}
        setOpen={setOping}
        userdata={user}
      />
      <AllAttendance
        mon={currentMon}
        yea={currentYear}
        open={opn}
        setOpen={setOpn}
        userdata={user}
      />
    </>
  );
};

export default ReportModels;
