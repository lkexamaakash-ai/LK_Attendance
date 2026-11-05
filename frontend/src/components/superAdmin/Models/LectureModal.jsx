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

const LectureModal = ({ open, setOpen, type, lec, refetch, reset }) => {
  const router = useRouter();
  const isoTo24Hour = (isoString) => {
    if (!isoString) return "";
    const safeIso = isoString;
    const date = new Date(safeIso);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

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

  const [branch, setBranch] = useState([]);
  const [subject, setSubject] = useState([]);
  const [users, setUsers] = useState([]);
  const [batch, setBatch] = useState([]);
  const [courses, setCourses] = useState([]);

  const [Branc, setBranc] = useState("");
  const [sub, setSub] = useState("");
  const [fac, setFac] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [intime, setIntime] = useState("");
  const [outtime, setOuttime] = useState("");
  const [totalLecture, setTotalLecture] = useState(null);
  const [bat, setBat] = useState("");

  const [lectname, setLectname] = useState(null);
  const [lectfac, setLectfac] = useState(null);
  const [courseId, setCourseId] = useState(null);

  const { fetchBranch, fetchUser, fetchSubject, fetchLecture, fetchCourse } =
    useManagement();

  const toDateInput = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  useEffect(() => {
    console.log(lec);
    if (lec?.batch?.course.branch?.id) {
      setLectname(lec?.batch?.branch?.name);
      setBranc(lec?.batch?.course.branch?.id);
    }
    if (lec?.batch?.course?.id) {
      setCourseId(lec.batch.course.id);
    }
    if (lec?.subject) {
      console.log(lec.subject.id);
      setSub(lec.subject.id);
    }
    if (lec?.faculty) {
      setLectfac(lec.faculty.name);
      setFac(lec.faculty.id);
    }
    if (lec?.StartDate) {
      setStartDate(toDateInput(lec?.StartDate));
    }
    if (lec?.EndDate) {
      setEndDate(toDateInput(lec?.EndDate));
    }
    if (lec?.startTime) {
      setIntime(isoTo24Hour(lec?.startTime));
    }
    if (lec?.endTime) {
      setOuttime(isoTo24Hour(lec?.endTime));
    }
    if (lec?.batch) {
      setBat(lec.batch.id);
    }
    if (lec?.TotalScheduled) {
      setTotalLecture(lec.TotalScheduled);
    }
  }, [lec]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchBranch();

      setBranch(data);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCourse();

      const filterdata = data.filter((cou) => cou.branchId === Branc);

      setCourses(filterdata);
    };
    loadData();
  }, [Branc]);

  useEffect(() => {
    const loadData = async () => {
      const userdata = await fetchUser();

      let filteruser = userdata.filter((user) => user.role === "FACULTY");

      if (Branc) {
        filteruser = filteruser.filter((user) =>
          user.facultyBranches?.some((item) => item.branchId === Number(Branc)),
        );
      }

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
          (batch) => batch.course.id === courseId,
        );
        // console.log(filtereddata);
        setBatch(filtereddata);
      };

      fetchBatch();

      setUsers(filteruser);
    };
    loadData();
  }, [courseId, Branc]);

  useEffect(() => {
    const loadData = async () => {
      const subjectdata = await fetchSubject();
      const filtersubject = subjectdata.filter((sub) => sub.batchId === bat);

      setSubject(filtersubject);
    };

    loadData();
  }, [bat]);

  const combineDateTimeToISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    let data = new Date(`${dateStr}T${timeStr}`).toISOString();
    console.log(data);
    return data;
  };

  const handleCreateLecture = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;

      const { data } = await axios.post(
        `${mainRoute}/api/lecture`,
        {
          facultyId: fac,
          subjectId: sub,
          batchId: bat,
          StartDate: startDate,
          EndDate: endDate,
          startTime: combineDateTimeToISO(startDate, intime),
          endTime: combineDateTimeToISO(startDate, outtime),
          TotalScheduled: totalLecture,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Lecture Created Successfully");

      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in creating lecture");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  const handleEdit = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;
      let id = lec.id;

      const { data } = await axios.put(
        `${mainRoute}/api/lecture/${id}`,
        {
          facultyId: fac,
          subjectId: sub,
          branchId: Branc,
          StartDate: startDate,
          EndDate: endDate,
          startTime: combineDateTimeToISO(startDate, intime),
          endTime: combineDateTimeToISO(startDate, outtime),
          TotalScheduled: totalLecture,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Lecture successfully edited");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in editing lecture");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  const deleteBranch = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;
      let id = lec.id;

      const { data } = await axios.delete(`${mainRoute}/api/lecture/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Lecture deleted Successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in deleting lecture");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  const handleReset = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;
      let id = lec.id;

      const { data } = await axios.post(
        `${mainRoute}/api/lecture/reset-cycle/${id}`,
        {
          startDate: startDate,
          endDate: endDate,
          startTime: intime,
          endTime: outtime,
          totalScheduled: totalLecture,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Lecture Reset successfully");
      setOpen(false);
      await refetch();
    } catch (err) {
      toast.error("Error in reseting lecture");
      setOpen(false);
      await refetch();
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-auto p-5 w-[40vw] bg-white shadow-2xl rounded-2xl border border-stone-200  ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <h2 className="px-5 pb-3 text-xl font-semibold text-maroon-800">
              {{ add: "Add", create: "Create", assign: "Assign", edit: "Edit", delete: "Delete" }[type] || ""} Lecture
            </h2>

            {type === "create" && (
              <div className="flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:gap-2 gap-5 ">
                <h1 className="font-bold text-xl">Create Lecture</h1>

                <div className="flex gap-2 ">
                  <Label>Branch:</Label>
                  <Select onValueChange={(v) => setBranc(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Branch`} />
                    </SelectTrigger>
                    <SelectContent>
                      {branch.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Course:</Label>
                  <Select onValueChange={(v) => setCourseId(v)}>
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

                <div className="flex gap-2 ">
                  <Label>Batch:</Label>
                  <Select onValueChange={(v) => setBat(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batch`} />
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

                <div className="flex gap-2 ">
                  <Label>Subject:</Label>
                  <Select onValueChange={(v) => setSub(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Subject`} />
                    </SelectTrigger>
                    <SelectContent>
                      {subject.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Faculty:</Label>
                  <Select onValueChange={(v) => setFac(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Faculty`} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((item, i) => {
                        return (
                          <SelectItem key={i} value={item.id}>
                            {item.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Total Lectures:</Label>
                  <Input
                    type={`number`}
                    placeholder={`Total Lectures`}
                    onChange={(e) => setTotalLecture(e.target.value)}
                    min={0}
                  />
                </div>

                <div className="flex gap-2  [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 w-full flex-row! justify-around ">
                  <div>
                    <Label htmlFor={`StartDate`}>Start Date</Label>
                    <Input
                      type={`date`}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`EndDate`}>End Date</Label>
                    <Input
                      type={`date`}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2  [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 w-full flex-row! justify-around ">
                  <div>
                    <Label htmlFor={`InTime`}>In Time</Label>
                    <Input
                      type={`time`}
                      onChange={(e) => setIntime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`OutTime`}>Out Time</Label>
                    <Input
                      type={`time`}
                      onChange={(e) => setOuttime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="">
                  <Button onClick={handleCreateLecture}>Add new Lecture</Button>
                </div>
              </div>
            )}

            {type === "edit" && (
              <div className="flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:gap-2 gap-5 ">
                <h1 className="font-bold text-xl">Edit Lecture</h1>

                <div className="flex gap-2 ">
                  <Label>Branch:</Label>
                  <Select value={Branc} onValueChange={(v) => setBranc(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Branch`} />
                    </SelectTrigger>
                    <SelectContent>
                      {branch.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Course:</Label>
                  <Select
                    value={courseId}
                    onValueChange={(v) => setCourseId(v)}
                  >
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

                <div className="flex gap-2 ">
                  <Label>Batch:</Label>
                  <Select value={bat} onValueChange={(v) => setBat(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batch`} />
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

                <div className="flex gap-2 ">
                  <Label>Subject:</Label>
                  <Select value={sub} onValueChange={(v) => setSub(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={"Subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subject.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Faculty:</Label>
                  <Select value={fac} onValueChange={(v) => setFac(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={lectfac} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((item, i) => {
                        return (
                          <SelectItem key={i} value={item.id}>
                            {item.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Total Lectures:</Label>
                  <Input
                    type={`number`}
                    placeholder={`Total Lectures`}
                    onChange={(e) => setTotalLecture(e.target.value)}
                    min={0}
                    value={totalLecture}
                  />
                </div>

                <div className="flex gap-2  [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 w-full flex-row! justify-around ">
                  <div>
                    <Label htmlFor={`StartDate`}>Start Date</Label>
                    <Input
                      type={`date`}
                      onChange={(e) => setStartDate(e.target.value)}
                      value={startDate}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`EndDate`}>End Date</Label>
                    <Input
                      type={`date`}
                      onChange={(e) => setEndDate(e.target.value)}
                      value={endDate}
                    />
                  </div>
                </div>

                <div className="flex gap-2  [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 w-full flex-row! justify-around ">
                  <div>
                    <Label htmlFor={`InTime`}>In Time</Label>
                    <Input
                      type={`time`}
                      onChange={(e) => setIntime(e.target.value)}
                      value={intime}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`OutTime`}>Out Time</Label>
                    <Input
                      type={`time`}
                      onChange={(e) => setOuttime(e.target.value)}
                      value={outtime}
                    />
                  </div>
                </div>

                <div className="">
                  {reset ? (
                    <Button onClick={handleReset}>Reset Lecture</Button>
                  ) : (
                    <Button onClick={handleEdit}>Edit Lecture</Button>
                  )}
                </div>
              </div>
            )}
            {type === "delete" && (
              <>
                <div className="h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <p className="">
                    You Want To Delete{" "}
                    <span className="font-bold text-2xl text-red-600">
                      {lec?.subject?.name}
                    </span>{" "}
                    Lecture
                  </p>
                  <Button
                    onClick={deleteBranch}
                    variant="destructive"
                    className={`cursor-pointer`}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LectureModal;
