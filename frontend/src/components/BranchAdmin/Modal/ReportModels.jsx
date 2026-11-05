import { mainRoute } from "@/components/apiroute";
import FacultyAttendanceBar from "@/components/chart/FacultyAttendanceBar";
import FacultyLectureStatusDonut from "@/components/chart/FacultyLectureStatusDonut";
import FacultyPenaltyDonut from "@/components/chart/FacultyPenaltyDonut";
import MonthlySalaryDonut from "@/components/chart/MonthlySalaryDonut";
import SalaryBasedFacultyDonut from "@/components/chart/SalaryBasedFacultyDonut";
import AllAttendance from "@/components/superAdmin/Models/AllAttendance";
import SelectBranchModels from "@/components/superAdmin/Models/SelectBranchModels";
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
      let res;
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
        res = data.data;
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
          res = data.data;
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
          res = data.data;
        }
      }

      if (!res) return;

      

      if (branchId && res.branchLectureSummary?.length > 0) {
        const branchData = res.branchLectureSummary.find(
          (itemBranch) => Number(itemBranch.branchId) === Number(branchId),
        );

        if (!branchData) {
          setChartData(null);
          return;
        }

        const filteredData = {
          ...res,

          branchLectureSummary: [branchData],

          conducted: branchData.conducted,
          cancelled: branchData.cancelled,
          missed: branchData.missed,

          PlannedLectures:
            branchData.conducted + branchData.cancelled + branchData.missed,

          remainingLectures: 0,
        };
        console.log(filteredData)

        setChartData(filteredData);
      } else {
        console.log(res)
        setChartData(res);
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

*Late Penalty*: ${chartData?.netPay}
*Work Hour Shortfall Deduction*: ${chartData?.breakdown?.fixedLatePenalties}
*Overtime Compensation*: ${chartData?.breakdown?.totalOvertimePay}

*Net Salary for the Monthy*: ${chartData?.netPay}
  `.trim();

    const whatsappURL = `https://wa.me/${
      user.phoneNumber
    }/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  const handleLectureBasedFacultySendWhatsappMsg = () => {
    const faculty = user; // assuming user = faculty object

    const subjectName = faculty?.lectures?.[0]?.subject?.name || "N/A";
    const totalScheduled =
      faculty?.lectures?.reduce(
        (sum, lec) => sum + (lec?.TotalScheduled || 0),
        0,
      ) || 0;

    const conductedLectures =
      faculty?.lectures?.reduce(
        (sum, lec) => sum + (lec?.attendance?.length || 0),
        0,
      ) || 0;

    const remainingLectures = totalScheduled - conductedLectures;
    const lectureRate = faculty?.lectureRate || 0;
    const totalPayout = conductedLectures * lectureRate;

    const message = `
    Dear *${faculty.name}*, In ${
      faculty?.lectures?.[0]?.batch?.course?.name
    } Course ${
      faculty?.lectures?.[0]?.batch?.name
    } Batch For *${subjectName}*, *${totalScheduled}* ${
      totalScheduled > 1 ? "lectures" : "lecture"
    } were allocated. As of ${
      list[currentMon]
    }, *${conductedLectures}* have been completed, leaving ${remainingLectures} lectures pending at ${
      faculty?.branch?.name
    } Branch. Kindly ensure the pending lectures are completed within the given timeline so that the syllabus remains on track. Thank you for your cooperation. Best regards, *Academic Coordinator*
  `.trim();

    const whatsappURL = `https://wa.me/${
      user.phoneNumber
    }/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  const [branchId, setBranchId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = localStorage.getItem("user");

    if (user) {
      setBranchId(JSON.parse(user)?.data?.user?.branchId);
    }
  }, []);

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-[#d8d3d382] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-auto p-5 md:w-[60vw] lg:w-[40vw] bg-white shadow-2xl rounded-2xl  ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer font-bold"
                onClick={() => {
                  setOpen(false);
                  setUser({});
                }}
              >
                x
              </span>
            </div>

            <div className="w-full">
              <div className="flex gap-4 border-b-2 pb-2">
                {/* <p className="text-xl font-semibold"></p> */}
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
                    Total Payout: ₹{chartData?.totalPayout}
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
                className={`w-1/2 mt-5 cursor-pointer bg-green-500 hover:bg-green-600 mx-auto`}
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
        currentMon={currentMon}
        userdata={user}
        list={list}
        open={oping}
        setOpen={setOping}
      />

      <AllAttendance
        mon={currentMon}
        yea={currentYear}
        open={opn}
        setOpen={setOpn}
        userdata={user}
        whoe={"branchadmin"}
        branchid={branchId}
      />
    </>
  );
};

export default ReportModels;
