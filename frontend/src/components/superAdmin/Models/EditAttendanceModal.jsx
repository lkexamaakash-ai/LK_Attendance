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
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const EditAttendanceModal = ({ open, setOpen, attId, setUpd, upd, wheo }) => {
  const format = (iso) => {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };
  const [data, setData] = useState({});
  const [staffPreview, setStaffPreview] = useState(null);
  const [actualinTime, setActualInTime] = useState();
  const [actualoutTime, setActualOutTime] = useState();
  const [status, setStatus] = useState();
  const [lateEntry, setLateEntry] = useState(false);
  const [extraPenalty, setExtraPenalty] = useState();

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const loadData = async () => {
      try {
        const { data } = await axios.get(
          `${mainRoute}/api/staffAttendance/${attId}`,
          {
            headers: {
              Authorization: `Bearer ${tok.data.token}`,
            },
          },
        );
        console.log(data.data);
        setData(data.data);
      } catch (err) {
        console.log(err);
      }
    };

    loadData();
    setLateEntry(data.isLate);
  }, [open]);

  useEffect(() => {
    if (!data?.actualInTime || !data?.actualOutTime || !data?.status) return;

    setActualInTime(format(data.actualInTime));

    setActualOutTime(format(data.actualOutTime));

    setStatus(data.status);
  }, [data]);

  const formatTime = (isoTime) => {
    if (!isoTime) return "";
    const iso = isoTime;
    let date = new Date(iso);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (lateEntry) {
      setExtraPenalty(data.totalPenalty - data.extraPenalty);
    } else {
      setExtraPenalty(0);
    }
  }, [lateEntry]);

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

    if (!actualOut || !monthlySalary || !workingMinutesPerDay || !scheduledIn) {
      console.log(
        actualOut,
        "-",
        monthlySalary,
        "-",
        workingMinutesPerDay,
        "-",
        scheduledIn,
      );
      return null;
    }

    const totalMonthlyMinutes = workingDays * workingMinutesPerDay;
    const perMinuteRate = monthlySalary / totalMonthlyMinutes;

    // ---- BASIC CALCS ----
    const actualWorkedMinutes = Math.floor(
      (actualOut - actualIn) / (1000 * 60),
    );
    console.log(actualWorkedMinutes);

    const requiredMinutes = workingMinutesPerDay;

    // ---- LATE START ----
    const lateMinutes = Math.max(
      0,
      Math.floor((actualIn - scheduledIn) / (1000 * 60)),
    );

    const isLateBeyondGrace = lateMinutes > GRACE_MINUTES ? true : false;

    // ---- SHORTFALL ----
    const shortfallMinutes = Math.max(0, requiredMinutes - actualWorkedMinutes);

    // ---- OVERTIME ----
    const extraMinutes = Math.max(0, actualWorkedMinutes - requiredMinutes);

    const overtimeMinutes =
      Math.floor(extraMinutes) >= 30 ? Math.floor(extraMinutes) : 0;

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

  const getDaysInCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  useEffect(() => {
    let startTime = data?.shiftStartTime;
    let endTime = data?.shiftEndTime;
    let actualinTime = data?.actualInTime;
    let actualoutTime = data?.actualOutTime;
    if (!startTime || !endTime || !actualinTime || !actualoutTime) return;
    const start = data?.shiftStartTime?.split("T")[0];
    const end = data?.shiftEndTime?.split("T")[0];
    let s = `${start}T${actualinTime}`;
    let e = `${end}T${actualoutTime}`;

    const workingDays = getDaysInCurrentMonth();

    const result = calculateStaffAttendanceUI({
      monthlySalary: data?.staff?.salary,
      workingDays: workingDays,
      workingMinutesPerDay: data?.staff?.workingMinutesPerDay,
      scheduledIn: new Date(startTime),
      scheduledOut: new Date(endTime),
      actualIn: new Date(actualinTime),
      actualOut: new Date(actualoutTime),
    });
    console.log(result);

    setStaffPreview(result);
  }, [data]);

  const updateAttendance = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user"));
      const { data } = await axios.patch(
        `${mainRoute}/api/staffAttendance/update/${attId}`,
        {
          status: status,
          actualInTime: actualinTime,
          actualOutTime: actualoutTime,
          isLate: lateEntry,
        },
        {
          headers: {
            Authorization: `Bearer ${tok.data.token}`,
          },
        },
      );

      if (data.success == true) {
        toast.success("Updated Successfully");
        setUpd(!upd);
        setOpen(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const closeFunc = () => {
    setOpen(false);
    setStatus("");
    setActualInTime("");
    setActualOutTime("");
  };

  return (
    <>
      <>
        {open && (
          <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center overflow-hidden">
            <div className="h-[80vh] p-5 xl:w-[40vw] w-[90%] bg-white shadow-2xl rounded-2xl border border-stone-200 overflow-hidden ">
              <div className="flex justify-end px-5">
                <span className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700" onClick={closeFunc}>
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
                    // value={date}
                    type={"text"}
                    value={new Date(data?.date).toDateString()}
                  />
                </div>
                <div>
                  <Label>Branch</Label>
                  <div className="">{data?.branch?.name}</div>
                </div>

                <div>
                  <Label>Staff Name</Label>
                  <div className="capitalize">{data?.staff?.name}</div>
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
                          readOnly
                          value={formatTime(data?.shiftStartTime)}
                        />
                      </div>
                      <div>
                        <Label>Shift Out Time</Label>
                        <Input
                          type={`text`}
                          readOnly
                          value={formatTime(data?.shiftEndTime)}
                        />
                      </div>
                    </div>

                    <div>
                      <div>
                        <Label>In Time</Label>
                        <Input
                          type={`time`}
                          value={actualinTime}
                          onChange={(e) => setActualInTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Out Time</Label>
                        <Input
                          type={`time`}
                          value={actualoutTime}
                          onChange={(e) => setActualOutTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Late Entry</Label>

                      {wheo === "branchadmin" ? (
                        <Input
                          type={`text`}
                          value={`${staffPreview?.lateEntry}`}
                          placeholder={`Yes/No`}
                          readOnly
                        />
                      ) : (
                        <Select value={lateEntry} onValueChange={setLateEntry}>
                          <SelectTrigger className={`w-full`}>
                            <SelectValue placeholder={"Late Entry"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={true}>Yes</SelectItem>
                            <SelectItem value={false}>No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label>Late Penalty</Label>
                      <div className="flex gap-2">
                        <Input
                          type={`text`}
                          placeholder={`fixed Penalty`}
                          readOnly
                          value={extraPenalty}
                        />
                        <Input
                          type={`text`}
                          placeholder={`Extra Penalty`}
                          readOnly
                          value={
                            Math.floor(staffPreview?.additionalPenalty) || 0
                          }
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

                <div className="flex-row! w-full [&>Button]:cursor-pointer sticky bottom-0">
                  <Button onClick={closeFunc} className={`w-1/2`}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateAttendance()}
                    className={`w-1/2`}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </>
  );
};

export default EditAttendanceModal;
