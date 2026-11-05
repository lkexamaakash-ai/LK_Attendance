"use client";
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

const LectureCreateModal = ({ open, setOpen, lec, type, refetch, reset }) => {
  const router = useRouter();
  const { fetchSubject, fetchUser } = useManagement();
  const [batch, setbatch] = useState([]);

  const isoTo24Hour = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [branch, setBranch] = useState({});
  const [subj, setSubj] = useState([]);
  const [user, setUser] = useState([]);

  // facultyId,
  //   subjectId,
  //   branchId,
  //   StartDate,
  //   EndDate,
  //   startTime,
  //   endTime,

  const toDateInput = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  const [facultyId, setFacultyId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  // const [branchId,setBranchId] = useState(null)
  const [StartDate, setStartDate] = useState(null);
  const [EndDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [totalLecture, setTotalLecture] = useState(null);
  const [batchId, setBatchId] = useState(null);
  // console.log(lec);

  useEffect(() => {
    console.log(lec);

    if (lec?.batch) {
      setBatchId(lec.batch.id);
    }
    if (lec?.facultyId) {
      setFacultyId(lec.facultyId);
    }
    if (lec?.subjectId) {
      setSubjectId(lec.subjectId);
    }
    if (lec?.StartDate) {
      setStartDate(toDateInput(lec.StartDate));
    }
    if (lec?.EndDate) {
      setEndDate(toDateInput(lec.EndDate));
    }
    if (lec?.startTime) {
      setStartTime(isoTo24Hour(lec.startTime));
    }
    if (lec?.endTime) {
      setEndTime(isoTo24Hour(lec.endTime));
    }

    if (lec?.TotalScheduled) {
      setTotalLecture(lec.TotalScheduled);
    }
  }, [lec]);

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

      console.log(data.data);

      const filtereddata = data.data.filter(
        (batch) => batch.course.branchId === tok.data.user.branchId,
      );
      console.log(filtereddata);
      setbatch(filtereddata);
    };

    fetchBatch();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const subject = await fetchSubject();
      const filtersubject = subject.filter((sub) => sub.batch.id === batchId);

      setSubj(filtersubject);
    };

    loadData();
  }, [batchId]);

  useEffect(() => {
    const branchdata = JSON.parse(localStorage.getItem("user"));
    console.log(branchdata);
    const loadData = async () => {
      const userdata = await fetchUser();

      // console.log(subject);

      const filteruserdata = userdata
        .filter((user) => user.role === "FACULTY")
        .filter((user) =>
          user.facultyBranches.some(
            (item) => item.branchId === branchdata.data.user.branch.id,
          ),
        );

      console.log(filteruserdata);
      // console.log(filtersubject);

      setUser(filteruserdata);
    };

    loadData();

    setBranch(branchdata.data.user.branch);
  }, []);

  const combineDateTimeToISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}`).toISOString();
  };

  const handleCreate = async () => {
    try {
      let tokn = JSON.parse(localStorage.getItem("user"));
      let token = tokn.data.token;
      const { data } = await axios.post(
        `${mainRoute}/api/lecture`,
        {
          facultyId,
          subjectId,
          batchId: batchId,
          StartDate,
          EndDate,
          startTime: combineDateTimeToISO(StartDate, startTime),
          endTime: combineDateTimeToISO(StartDate, endTime),
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
    } catch (error) {
      toast.error("Error in Creating Lecture");
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
          startDate: StartDate,
          endDate: EndDate,
          startTime: startTime,
          endTime: endTime,
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

  const handleEdit = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;
      let id = lec.id;

      const { data } = await axios.put(
        `${mainRoute}/api/lecture/${id}`,
        {
          facultyId,
          subjectId,
          batchId: batchId,
          StartDate,
          EndDate,
          startTime: combineDateTimeToISO(StartDate, startTime),
          endTime: combineDateTimeToISO(EndDate, endTime),
          TotalScheduled: totalLecture,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Lecture Edited Successfully");
      // router.refresh();

      setOpen(false);
      await refetch();
    } catch (error) {
      toast.error("Error in Editing Lecture");
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
      toast.success("Lecture Deleted Successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (error) {
      toast.error("Error in Deleting Lecture");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center ">
          <div className="h-auto p-5 xl:w-[40vw] w-[90%] bg-white shadow-2xl rounded-2xl border border-stone-200 ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>

            <div>
              <h1 className="text-xl font-semibold mb-3 text-maroon-800">
                {type === "create"
                  ? "Create a New Lecture"
                  : type === "edit"
                    ? "Edit Lecture"
                    : "Delete Lecture"}
              </h1>
            </div>
            {type === "create" && (
              <div className="flex flex-col gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label>Branch:</Label>
                  <Input
                    type={`text`}
                    placeholder={`Branch Name`}
                    value={branch?.name}
                    readOnly
                  />
                </div>

                <div>
                  <Label>Batch:</Label>
                  <Select onValueChange={(v) => setBatchId(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batch`} />
                    </SelectTrigger>
                    <SelectContent>
                      {batch.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {`${item.name} - ${item.course.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject:</Label>
                  <Select onValueChange={(v) => setSubjectId(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Subject`} />
                    </SelectTrigger>
                    <SelectContent>
                      {subj.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Faculty:</Label>
                  <Select onValueChange={(v) => setFacultyId(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Faculty`} />
                    </SelectTrigger>
                    <SelectContent>
                      {user.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
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

                <div className="flex-row! [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <div className="">
                    <Label>Start Date:</Label>
                    <Input
                      type={"date"}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <Label>End Date:</Label>
                    <Input
                      type={"date"}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-row! [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <div className="">
                    <Label>Entry Time:</Label>
                    <Input
                      type={"time"}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <Label>Exit Time:</Label>
                    <Input
                      type={"time"}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-row! w-full [&>Button]:cursor-pointer">
                  <Button
                    onClick={() => {
                      setOpen(false);
                    }}
                    className={`w-1/2`}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className={`w-1/2`}>
                    Save
                  </Button>
                </div>
              </div>
            )}

            {type === "edit" && (
              <div className="flex flex-col gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label>Branch:</Label>
                  <Input
                    type={`text`}
                    value={branch?.name}
                    placeholder={`Branch Name`}
                    readOnly
                  />
                </div>

                <div>
                  <Label>Batch:</Label>
                  <Select value={batchId} onValueChange={(v) => setBatchId(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batch`} />
                    </SelectTrigger>
                    <SelectContent>
                      {batch.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {`${item.name} - ${item.course.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject:</Label>
                  <Select
                    value={subjectId}
                    onValueChange={(v) => setSubjectId(v)}
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Subject`} />
                    </SelectTrigger>
                    <SelectContent>
                      {subj.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Faculty:</Label>
                  <Select
                    value={facultyId}
                    onValueChange={(v) => setFacultyId(v)}
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={lec?.faculty?.name} />
                    </SelectTrigger>
                    <SelectContent>
                      {user.map((item, i) => (
                        <SelectItem key={i} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 ">
                  <Label>Total Lectures:</Label>
                  <Input
                    type={`number`}
                    placeholder={`Total Lectures`}
                    onChange={(e) => setTotalLecture(e.target.value)}
                    value={totalLecture}
                    min={0}
                  />
                </div>

                <div className="flex-row! [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <div className="">
                    <Label>Start Date:</Label>
                    <Input
                      type={"date"}
                      value={StartDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <Label>End Date:</Label>
                    <Input
                      type={"date"}
                      value={EndDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-row! [&>div]:w-1/2 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <div className="">
                    <Label>Entry Time:</Label>
                    <Input
                      type={"time"}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="">
                    <Label>Exit Time:</Label>
                    <Input
                      type={"time"}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-row! w-full [&>Button]:cursor-pointer">
                  <Button
                    onClick={() => {
                      setOpen(false);
                    }}
                    className={`w-1/2`}
                  >
                    Cancel
                  </Button>
                  <div className="w-1/2">
                    {reset ? (
                      <Button className={`w-full`} onClick={handleReset}>
                        Reset Lecture
                      </Button>
                    ) : (
                      <Button className={`w-full`} onClick={handleEdit}>
                        Edit Lecture
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {type === "delete" && (
              <>
                <div className="h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <p className="">
                    You Want To Delete Subject Lecture{" "}
                    <span className="font-bold text-2xl text-red-600">
                      {lec?.subject?.name}
                    </span>{" "}
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

export default LectureCreateModal;
