import { mainRoute } from "@/components/apiroute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManagement } from "@/context/ManagementContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const StaffModal = ({ open, setOpen }) => {
  const router = useRouter();
  const [branch, setBranch] = useState({});
  const [users, setUser] = useState([]);
  const [staffId, setStaffId] = useState(null);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [date, setDate] = useState(new Date().getFullYear());

  const [status, setStatus] = useState("PRESENT");

  const [actualinTime, setActualInTime] = useState(
    new Date().toISOString().split("T")[1],
  );
  const [actualoutTime, setActualOutTime] = useState(
    new Date().toISOString().split("T")[1],
  );
  const [salary, setSalary] = useState(null);
  const [workingMinutesPerDay, setWorkingMinutesPerDay] = useState(null);

  const formatTime = (isoTime) => {
    if (!isoTime) return "";

    const date = new Date(isoTime);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const { fetchBranch, fetchUser, fetchSubject, fetchLecture } =
    useManagement();

  useEffect(() => {
    // const data = JSON.parse(localStorage.getItem("user"));
    // setbranch(data.data.user.branch);

    // const loadData = async() =>{
    //   const userdata = await fetchUser()

    //   const filterUser = userdata.filter((user)=>user.role === "STAFF").filter((user)=>user.branchId === branch.id);

    //   console.log(filterUser)
    //   setUser(filterUser)
    // }
    // loadData()

    const loaddata = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const branchId = user.data.user.branchId;
      setBranch(user.data.user.branch);

      const userDate = await fetchUser();

      const filterData = userDate
        .filter((user) => user.role === "STAFF")
        .filter((user) => user.branchId === branchId)
        .filter((user) => user.isActive === true);

      console.log(filterData);
      setUser(filterData);
    };

    loaddata();
  }, []);

  useEffect(() => {
    const userdata = users.find((item) => item.id === staffId);
    setSalary(userdata?.salary);
    setWorkingMinutesPerDay(userdata?.workingMinutesPerDay);

    setStartTime(userdata?.shiftStartTime);
    setEndTime(userdata?.shiftEndTime);
  }, [staffId]);

  const [staffPreview, setStaffPreview] = useState(null);

  const getDaysInCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  const THIRTY_MIN = 30 * 60 * 1000;

  function calculateStaffAttendanceUI({
    monthlySalary,
    workingDays,
    workingMinutesPerDay,
    scheduledIn,
    scheduledOut,
    actualIn,
    actualOut,
  }) {
    const GRACE_MINUTES = 15;
    const FIXED_PENALTY = 50;

    if (!actualOut || !monthlySalary || !workingMinutesPerDay || !scheduledIn)
      return null;

    const totalMonthlyMinutes = workingDays * workingMinutesPerDay;
    const perMinuteRate = monthlySalary / totalMonthlyMinutes;

    // ---- BASIC CALCS ----
    const actualWorkedMinutes = Math.floor(
      (actualOut - actualIn) / (1000 * 60),
    );

    const requiredMinutes = workingMinutesPerDay;

    // ---- LATE START ----
    const lateMinutes = Math.max(
      0,
      Math.floor((actualIn - scheduledIn) / (1000 * 60)),
    );

    const isLateBeyondGrace = lateMinutes > GRACE_MINUTES;

    // ---- SHORTFALL ----
    const shortfallMinutes = Math.max(0, requiredMinutes - actualWorkedMinutes);

    // ---- OVERTIME ----
    const extraMinutes = Math.max(0, actualWorkedMinutes - requiredMinutes);

    const overtimeMinutes = Math.floor(extraMinutes);
    const overtimePay =
      overtimeMinutes >= 30 ? Math.floor(overtimeMinutes * perMinuteRate) : 0;

    // ---- PENALTY ----
    let fixedPenalty = isLateBeyondGrace ? FIXED_PENALTY : 0;
    let additionalPenalty = 0;

    if (shortfallMinutes > GRACE_MINUTES) {
      const penaltyMinutes = shortfallMinutes;
      additionalPenalty = penaltyMinutes * perMinuteRate;
    }

    const totalPenalty = fixedPenalty + additionalPenalty;

    return {
      requiredMinutes,
      actualWorkedMinutes,
      lateEntry: isLateBeyondGrace,

      lateMinutes,
      shortfallMinutes,

      fixedPenalty,
      additionalPenalty: Number(additionalPenalty.toFixed(2)),
      totalPenalty: Number(totalPenalty.toFixed(2)),

      overtimeMinutes,
      overtimePay,

      perMinuteRate: Number(perMinuteRate.toFixed(2)),
    };
  }

  useEffect(() => {
    if (!startTime || !endTime || !actualinTime || !actualoutTime) return;
    const start = startTime.split("T")[0];
    const end = endTime.split("T")[0];

    const workingDays = getDaysInCurrentMonth();

    const result = calculateStaffAttendanceUI({
      monthlySalary: salary,
      workingDays: workingDays,
      workingMinutesPerDay: workingMinutesPerDay,
      scheduledIn: new Date(startTime),
      scheduledOut: new Date(endTime),
      actualIn: new Date(new Date(`${start}T${actualinTime}`).toISOString()),
      actualOut: actualoutTime
        ? new Date(new Date(`${end}T${actualoutTime}`).toISOString())
        : null,
    });

    setStaffPreview(result);
  }, [startTime, endTime, actualinTime, actualoutTime]);

  const markStaffAttendance = async () => {
    try {
      let tokn = JSON.parse(localStorage.getItem("user"));
      let token = tokn.data.token;

      const start = startTime.split("T")[0];
      const end = endTime.split("T")[0];

      const { data } = await axios.post(
        `${mainRoute}/api/staffAttendance`,
        {
          staffId: staffId,
          branchId: branch.id,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          actualInTime: new Date(
            new Date(`${start}T${actualinTime}`).toISOString(),
          ),
          actualOutTime: new Date(
            new Date(`${end}T${actualoutTime}`).toISOString(),
          ),
          date: new Date(date).toISOString(),
          status: status,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Attendance Marked Successfully");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.log(err);
      console.log(err.message);
      toast.error("Error in marking attendance");
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center overflow-hidden">
          <div className="h-[80vh] p-5 w-[90%] xl:w-[40vw] bg-white shadow-2xl rounded-2xl border border-stone-200 overflow-hidden ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold mb-3 text-maroon-800">Staff Attendance</h1>
            </div>

            <div className="flex h-[90%] flex-col gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 overflow-y-auto overflow-x-hidden">
              <div>
                <Label>Date</Label>
                <Input
                  value={date}
                  type={`date`}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Input type={`text`} value={branch.name} readOnly />
              </div>
              <div>
                <Label>Staff Name</Label>
                <Select onValueChange={(v) => setStaffId(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Staff Name`} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((item, i) => (
                      <SelectItem key={i} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Status`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"PRESENT"}>Present</SelectItem>
                    <SelectItem value={"ONLEAVE"}>Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "PRESENT" && (
                <>
                  <div>
                    <div>
                      <Label>Shift In Time</Label>
                      <Input
                        type={`text`}
                        value={formatTime(startTime) || "00:00"}
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>Shift Out Time</Label>
                      <Input
                        type={`text`}
                        value={formatTime(endTime) || "00:00"}
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <div>
                      <Label>In Time</Label>
                      <Input
                        type={`time`}
                        onChange={(e) => setActualInTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Out Time</Label>
                      <Input
                        type={`time`}
                        onChange={(e) => setActualOutTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Late Entry</Label>
                    <Input
                      type={`text`}
                      value={`${staffPreview?.lateEntry}`}
                      placeholder={`Yes/No`}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label>Late Penalty</Label>
                    <div className="flex gap-2">
                      <Input
                        type={`text`}
                        placeholder={`fixed Penalty`}
                        readOnly
                        value={Math.floor(staffPreview?.fixedPenalty) || 0}
                      />
                      <Input
                        type={`text`}
                        placeholder={`Extra Penalty`}
                        readOnly
                        value={Math.floor(staffPreview?.additionalPenalty) || 0}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Overtime Duration(mins)</Label>
                    <Input
                      type={`text`}
                      placeholder={`70mins`}
                      readOnly
                      value={
                        staffPreview?.overtimeMinutes >= 30
                          ? staffPreview?.overtimeMinutes
                          : 0 || 0
                      }
                    />
                  </div>

                  <div>
                    <Label>Overtime Pay</Label>
                    <Input
                      type={`text`}
                      placeholder={`100`}
                      value={staffPreview?.overtimePay || 0}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div className="flex-row! w-full [&>Button]:cursor-pointer">
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={`w-1/2`}
                >
                  Cancel
                </Button>
                <Button onClick={markStaffAttendance} className={`w-1/2`}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffModal;
