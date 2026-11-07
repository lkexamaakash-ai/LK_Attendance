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
import { Textarea } from "@/components/ui/textarea";
import { useManagement } from "@/context/ManagementContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const FacultyModal = ({ open, setOpen }) => {
  const router = useRouter();
  const [batch, setBatch] = useState([]);
  const [bra, setBra] = useState([]);
  const [users, setUsers] = useState([]);
  const [lec, setLec] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyType, setFacultyType] = useState([]);
  const [comment, setComment] = useState("");

  const [course, setCourse] = useState(null);

  const [us, setUs] = useState({});
  const [date, setDate] = useState(new Date());

  const [status, setStatus] = useState(null);
  const [payout, setPayout] = useState(0);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectLecture, setSelectedLecture] = useState(null);
  const [lecture, setLecture] = useState({});
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [filteredSubject, setFilteredSubject] = useState([]);
  const [filteredLecture, setFilteredLecture] = useState([]);

  const [selectFaculty, setSelectFaulty] = useState({});
  const [faclec, setFacLec] = useState([]);
  const [lectList, setLectList] = useState([]);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const [inTime, setIntime] = useState(getCurrentTime());
  const [outTime, setOuttime] = useState(getCurrentTime());

  const { fetchBranch, fetchUser, fetchSubject, fetchLecture, fetchCourse } =
    useManagement();

  function formatTime(isoIst) {
    if (!isoIst) return "";

    // 🔥 remove Z so JS treats it as local time
    const safeIso = isoIst;

    const date = new Date(safeIso);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  useEffect(() => {
    const loadBranch = async () => {
      const branchData = await fetchBranch();

      setBra(branchData);
    };

    loadBranch();
  }, []);

  useEffect(() => {
    console.log(selectFaculty);
    setFacLec(selectFaculty.lectures);
  }, [selectFaculty]);

  useEffect(() => {
    const loadData = async () => {
      const courseData = await fetchCourse();

      const filterCourse = courseData.filter(
        (course) => course.branchId === selectedBranch,
      );
      console.log(filterCourse);

      setCourses(filterCourse);
    };
    loadData();
  }, [selectedBranch]);

  useEffect(() => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;
    const fetchBatch = async () => {
      const { data } = await axios.get(`${mainRoute}/api/batch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const filtereddata = data.data.filter(
        (batch) => batch.courseId === course,
      );
      // console.log(filtereddata);
      setBatch(filtereddata);
    };

    fetchBatch();
  }, [course]);

  useEffect(() => {
    const loadData = async () => {
      const userData = await fetchUser();
      const facultyOnly = userData
        .filter((user) => user.role === "FACULTY")
        .filter((user) => user.isActive === true);
      setUsers(facultyOnly);
      setFilteredFaculty(facultyOnly);
    };
    loadData();
  }, [selectedBranch]);

  useEffect(() => {
    if (!selectedBranch) {
      setFilteredFaculty(users);
      return;
    }
    const branchWiseFaculty = users.filter((user) =>
      user.facultyBranches.some(
        (item) => item.branchId === Number(selectedBranch),
      ),
    );
    setFilteredFaculty(branchWiseFaculty);
  }, [selectedBranch, users]);

  useEffect(() => {
    if (!selectFaculty) {
      setFilteredLecture(lec);
      return;
    }
    const lectureWiseFilter = lec.filter(
      (user) => user.faculty.id === Number(selectFaculty.id),
    );

    setFacultyType(selectFaculty.facultyType);

    setFilteredLecture(lectureWiseFilter);
  }, [selectFaculty, lec]);

  useEffect(() => {
    const load = async () => {
      const subjectData = await fetchLecture();
      const filterSub = subjectData
        .filter((sub) => sub.batchId === selectedBatch)
        .filter((sub) => sub.facultyId === selectFaculty.id);
      setLec(filterSub);
    };
    load();
  }, [selectFaculty, selectedBatch]);

  const settingpayout = async () => {
    const userdata = await fetchUser();

    const filterdata = userdata.find((user) => user.id === selectFaculty.id);

    if (status === "CONDUCTED") {
      setPayout(filterdata.lectureRate);
    }
    if (status === "CANCELLED") {
      setPayout(filterdata.lectureRate / 2);
    }
    if (status === "MISSED") {
      setPayout(0);
    }
  };

  // useEffect(() => {
  //   // settingpayout();
  // }, [status]);

  useEffect(() => {
    setSelectedLecture(lecture.id);
    const startTime = lecture.startTime;
    const endTime = lecture.endTime;
    setStartTime(formatTime(startTime));
    setEndTime(formatTime(endTime));
  }, [lecture]);

  const toTimeInput = (iso) => new Date(iso).toISOString().substring(11, 16);

  const [penalty, setPenalty] = useState(0);

  const FIFTEEN_MIN = 15 * 60 * 1000;

  const LECTURE_MINUTES = 120;

  function mergeTimeWithDate(baseDate, timeDate) {
    const merged = new Date(baseDate);

    const time = new Date(timeDate);

    merged.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    );

    return merged;
  }

  function calculateLectureBasedFaculty({
    plannedStart,
    plannedEnd,
    actualStart,
    actualEnd,
    lectureRate,
  }) {
    const FIFTEEN_MIN = 15 * 60 * 1000;

    let isLate = actualStart - plannedStart > FIFTEEN_MIN;
    let LateMin = (actualStart - plannedStart) / (60 * 1000);
    let isEarly = plannedEnd - actualEnd > FIFTEEN_MIN;
    let EarlyMin = (plannedEnd - actualEnd) / (60 * 1000);

    let penalty = "NONE";
    if (isLate && isEarly) penalty = "BOTH";
    else if (isLate) penalty = "LATE_START";
    else if (isEarly) penalty = "EARLY_END";

    let TotalP = LateMin + EarlyMin;

    let totalPenaltyMin = TotalP * 60 * 1000 >= FIFTEEN_MIN ? TotalP : 0;

    const workedMinutes = Math.max(
      0,
      Math.floor((actualEnd - actualStart) / (1000 * 60)),
    );

    console.log({
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
    });

    console.log("plannedStart:", plannedStart.toISOString());
    console.log("actualStart:", actualStart.toISOString());

    console.log(
      "Difference in mins:",
      (actualStart - plannedStart) / (1000 * 60),
    );

    const lectureEquivalent = workedMinutes / LECTURE_MINUTES;

    const calculatedPayout =
      lectureEquivalent <= 0.875
        ? Number((lectureEquivalent * lectureRate).toFixed(2))
        : lectureRate;

    return {
      penalty,
      workedMinutes,
      lectureEquivalent: Number(lectureEquivalent.toFixed(2)),
      calculatedPayout,
      totalPenaltyMin,
      message:
        penalty === "NONE"
          ? "On Time"
          : penalty === "LATE_START"
            ? "Late Start"
            : penalty === "EARLY_END"
              ? "Early End"
              : "Late + Early",
    };
  }

  const [cancelled, setCancelled] = useState(false);

  const [penaltyPreview, setPenaltyPreview] = useState(null);

  function applyStatusOnPayout(calculatedPayout, status) {
    console.log("Called");

    if (status === "MISSED") return 0;
    if (status === "CANCELLED") return calculatedPayout / 2;
    return calculatedPayout; // CONDUCTED
  }

  useEffect(() => {
    if (!lecture.startTime || !lecture.endTime || !status) return;

    const date = lecture.startTime.split("T")[0];

    const baseDate = new Date(`${date}T00:00:00`);

    const plannedStart = mergeTimeWithDate(baseDate, lecture.startTime);
    const plannedEnd = mergeTimeWithDate(baseDate, lecture.endTime);

    const result = calculateLectureBasedFaculty({
      plannedStart,
      plannedEnd,
      actualStart: new Date(`${date}T${inTime}`),
      actualEnd: new Date(`${date}T${outTime}`),
      lectureRate: selectFaculty.lectureRate,
    });

    const paying =
      result.calculatedPayout > 0
        ? result.calculatedPayout
        : selectFaculty.lectureRate;
    const finalPayout = applyStatusOnPayout(paying, status);
    console.log(finalPayout);
    setPenaltyPreview(result);
    setPayout(Math.floor(finalPayout));
  }, [lecture, status, inTime, outTime]);

  useEffect(() => {
    if (facultyType === "SALARY_BASED") {
      setStartTime(formatTime(selectFaculty.shiftStartTime));
      setEndTime(formatTime(selectFaculty.shiftEndTime));
    }
  }, [facultyType]);

  const markAttendance = async () => {
    try {
      let tokn = JSON.parse(localStorage.getItem("user"));
      let token = tokn.data.token;
      let today = new Date().toISOString().split("T")[0];

      if (status === "CANCELLED") setPayout(payout / 2);
      if (status === "MISSED") setPayout(0);
      const { data } = await axios.post(
        `${mainRoute}/api/attendance/lecture/attendance`,
        {
          lectureId: lecture.id,
          actualStartTime: new Date(`${today}T${inTime}`).toISOString(),
          actualEndTime: new Date(`${today}T${outTime}`).toISOString(),
          status: status,
          payout: payout,
          date,
          comment,
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
      if (err?.response?.data?.message === "Already Marked") {
        toast.warning("Already marked Attedance for this lecture");
      } else {
        toast.error("Error in marking attendance");
      }
      setOpen(false);
      router.refresh();
    }
  };

  const markSalaryBasedAttendance = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user")).data.token;
      let today = new Date();

      const { data } = axios.post(
        `${mainRoute}/api/attendance/faculty/attendance/mark`,
        {
          facultyId: selectFaculty.id,
          date: date,
          inTime: inTime,
          outTime: outTime,
          isLeave: status,
          lecture: lectList,
          comment: comment,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
        },
      );

      toast.success("Attendance Marked Successfully");
      setOpen(false);
      setLectList([]);
      router.refresh();
    } catch (err) {
      toast.error("Error in marking attendance");
      setOpen(false);
      router.refresh();
    }
  };

  const handleAddLect = (v) => {
    if (lectList.includes(v)) {
      return;
    }
    setLectList([...lectList, v]);
  };

  const handleDelete = (delUser) => {
    setLectList(lectList.filter((sel) => sel.id !== delUser.id));
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="flex max-h-[88vh] w-[92%] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl xl:w-[42vw] xl:max-w-2xl">
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold text-maroon-800">Faculty Attendance</h1>
                <p className="mt-0.5 text-xs text-slate-500">Record lecture status, penalty and comments.</p>
              </div>
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-6 pt-5 pb-0 [&>div]:flex [&>div]:flex-col [&>div]:gap-1.5">
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
                <Select onValueChange={(v) => setSelectedBranch(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Branch Name`} />
                  </SelectTrigger>
                  <SelectContent>
                    {bra.map((item, i) => (
                      <SelectItem key={i} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Label>Faculty Name</Label>
                <Select onValueChange={(v) => setSelectFaulty(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Faculty Name`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredFaculty.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No faculty found for this branch
                      </div>
                    ) : (
                      filteredFaculty.map((item, i) => (
                        <SelectItem key={i} value={item}>
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {facultyType === "LECTURE_BASED" && (
                <>
                  <div>
                    <Label>Course</Label>
                    <Select onValueChange={(v) => setCourse(v)}>
                      <SelectTrigger className={`w-full`}>
                        <SelectValue placeholder={`Course`} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((item, i) => (
                          <SelectItem key={i} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Batch</Label>
                    <Select onValueChange={(v) => setSelectedBatch(v)}>
                      <SelectTrigger className={`w-full`}>
                        <SelectValue placeholder={`Batch Name`} />
                      </SelectTrigger>
                      <SelectContent>
                        {batch.map((item, i) => (
                          <SelectItem key={i} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select onValueChange={(v) => setLecture(v)}>
                      <SelectTrigger className={`w-full`}>
                        <SelectValue placeholder={`Subject Name`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLecture.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No faculty found for this branch
                          </div>
                        ) : (
                          filteredLecture.map((item, i) => (
                            <SelectItem key={i} value={item}>
                              {item.subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label>Status</Label>
                <Select onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Status`} />
                  </SelectTrigger>
                  {facultyType === "LECTURE_BASED" ? (
                    <SelectContent>
                      <SelectItem value={`CONDUCTED`}>Conducted</SelectItem>
                      <SelectItem value={`CANCELLED`}>Cancelled</SelectItem>
                      <SelectItem value={`MISSED`}>Pre cancelled</SelectItem>
                    </SelectContent>
                  ) : (
                    <SelectContent>
                      <SelectItem value={false}>Present</SelectItem>
                      <SelectItem value={true}>On Leave</SelectItem>
                    </SelectContent>
                  )}
                </Select>
              </div>

              {facultyType === "SALARY_BASED" && (
                <>
                  <div className="">
                    <Label>Lectures</Label>
                    <Select onValueChange={(v) => handleAddLect(v)}>
                      <SelectTrigger className={`w-full`}>
                        <SelectValue placeholder={`Lectures`} />
                      </SelectTrigger>
                      <SelectContent>
                        {faclec.map((item, i) => (
                          <SelectItem key={i} value={item}>
                            {`${item?.subject?.name}-${item?.batch?.course?.branch?.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 flex-wrap">
                      {lectList.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap gap-2 items-center justify-center text-sm bg-[#8a2a3e] text-white p-1 rounded "
                        >
                          {`${item?.subject?.name}-${item?.batch?.name}-${item?.batch?.course?.name}-${item?.batch?.course?.branch?.name}`}
                          <div
                            onClick={() => handleDelete(item)}
                            className="text-black cursor-pointer"
                          >
                            x
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(status === "CONDUCTED" || facultyType === "SALARY_BASED") && (
                <>
                  <div>
                    <Label>Planned Time</Label>
                    <Input
                      type={`text`}
                      readOnly
                      className={`uppercase`}
                      value={`${startTime || "00:00"} - ${endTime || "00:00"}`}
                    />
                  </div>
                  <div>
                    <div>
                      <Label>In Time</Label>
                      <Input
                        type={`time`}
                        onChange={(e) => setIntime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Out Time</Label>
                      <Input
                        type={`time`}
                        onChange={(e) => setOuttime(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              {facultyType === "LECTURE_BASED" && (
                <>
                  <div>
                    <Label>Payout</Label>
                    <Input
                      value={payout}
                      readOnly
                      placeholder={`Payout`}
                      onChange={(e) => setPayout(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Penalty</Label>
                    <Input
                      type={`text`}
                      placeholder={`Penalty`}
                      value={`${penaltyPreview?.totalPenaltyMin || 0} mins`}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment..."
                  className="min-h-30 resize-none"
                />
              </div>

              <div className="flex-row! gap-3 w-full [&>button]:cursor-pointer sticky bottom-0 border-t border-stone-100 bg-white pt-3 pb-4">
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                  variant="outline" className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    facultyType === "LECTURE_BASED"
                      ? markAttendance
                      : markSalaryBasedAttendance
                  }
                  className="flex-1"
                >
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

export default FacultyModal;
