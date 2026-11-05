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

const SubjectModel = ({ open, setOpen, subject, type, refetch }) => {
  const [branch, setBranch] = useState({});
  const [batch, setBatch] = useState([]);

  const [name, setName] = useState("");
  const [bran, setBran] = useState("");
  const [bra, setBra] = useState(null);
  const [bat, setBat] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseId,setCourseId] = useState(null);

  const {fetchCourse} = useManagement();

  useEffect(() => {
    if (subject?.name) {
      setName(subject.name);
    }
    if (subject?.branch?.name) {
      setBra(subject.branch.name);
    }
  }, [subject]);

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


      const filtereddata = data.data.filter((batch) => batch.courseId === courseId);
      setBatch(filtereddata);
    };

    fetchBatch();
  }, [courseId]);

  useEffect(() => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;

    const fetchBranch = async () => {
      // const { data } = await axios.get(`${mainRoute}/api/branch`, {
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      setBranch(tok.data.user.branch);
    };

    fetchBranch();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCourse();

      const fetchedCourse = data.filter((course) => course.branchId === branch.id)
      
      setCourses(fetchedCourse);
    };

    loadData();
  }, [branch]);

  const router = useRouter();

  const handleSubjectCreate = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;

      const { data } = await axios.post(
        `${mainRoute}/api/subject`,
        {
          name,
          batchId: bat,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Subject Created Successfully");
      await refetch();
      setOpen(false);
    } catch (err) {
      toast.error("Error in creating subject");
      setOpen(false);
      await refetch();
    }
  };

  const handleSubjectEdit = async () => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;
  };

  const deleteBranch = async () => {
    try {
      let tok = JSON.parse(localStorage.getItem("user"));
      let token = tok.data.token;
      let id = subject.id;

      const { data } = await axios.delete(`${mainRoute}/api/subject/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Subject Deleted Successfully");
      router.refresh();
      setOpen(false);
      await refetch();
    } catch (err) {
      toast.error("Error in deleting subject");
      router.refresh();
      setOpen(false);
      await refetch();
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-auto p-5 xl:w-[40vw] w-[80%] bg-white shadow-2xl rounded-2xl border border-stone-200  ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <h2 className="px-5 pb-3 text-xl font-semibold text-maroon-800">
              {{ add: "Add", create: "Create", assign: "Assign", edit: "Edit", delete: "Delete" }[type] || ""} Subject
            </h2>

            {type === "create" && (
              <div className=" flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:gap-2 gap-5 ">
                <h1 className="font-bold text-xl">Create New Subject</h1>
                <div className="">
                  <Label htmlFor="SubName">Subject Name</Label>
                  <Input
                    onChange={(e) => setName(e.target.value)}
                    id={`SubName`}
                    type={`text`}
                    placeholder={`Subject Name`}
                  />
                </div>
                <div className="">
                  <Label htmlFor="code">Branch</Label>
                  <Input id={`code`} type={`text`} value={branch?.name} readOnly />
                </div>

                <div className="">
                  <Label htmlFor="code">Course</Label>
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

                <div className="">
                  <Label htmlFor="code">Batch</Label>
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
                <div className="">
                  <Button
                    onClick={handleSubjectCreate}
                    className={`cursor-pointer`}
                  >
                    Add Subject
                  </Button>
                </div>
              </div>
            )}

            {type === "assign" && (
              <div className=" flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:gap-2 gap-5 ">
                <h1 className="font-bold text-xl">
                  Assign Faculty to the Subject
                </h1>
                <div className="">
                  <Label htmlFor="SubName">Subject </Label>
                  <Input
                    onChange={(e) => setName(e.target.value)}
                    id={`SubName`}
                    type={`text`}
                    value={name}
                    placeholder={`Subject Name`}
                  />
                </div>
                <div className="">
                  <Label htmlFor="code">Branch</Label>
                  <Select onValueChange={(v) => setBran(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={bra} />
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
                <div className="">
                  <Label htmlFor="code">Batch</Label>
                  <Select onValueChange={(v) => setBran(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batch`} />
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
                <div className="">
                  <Button
                    onClick={handleSubjectCreate}
                    className={`cursor-pointer`}
                  >
                    Add Subject
                  </Button>
                </div>
              </div>
            )}

            {type === "edit" && (
              <div className=" flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:gap-2 gap-5 ">
                <h1 className="font-bold text-xl">Edit Subject</h1>
                <div className="">
                  <Label htmlFor="SubName">Subject Name</Label>
                  <Input
                    onChange={(e) => setName(e.target.value)}
                    id={`SubName`}
                    type={`text`}
                    placeholder={`Subject Name`}
                    value={name}
                  />
                </div>
                <div className="">
                  <Label htmlFor="code">Branch</Label>
                  <Select onValueChange={(v) => setBran(v)}>
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={bra} />
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
                <div className="">
                  <Button
                    onClick={handleSubjectEdit}
                    className={`cursor-pointer`}
                  >
                    Edit Subject
                  </Button>
                </div>
              </div>
            )}

            {type === "delete" && (
              <>
                <div className="h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <p className="">
                    You Want To Delete{" "}
                    <span className="font-bold text-2xl text-red-600">
                      {name}
                    </span>{" "}
                    Subject
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

export default SubjectModel;
