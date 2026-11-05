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

const BatchModels = ({ open, type, setOpen, branch, badmin, refetch }) => {
  const router = useRouter();
  // const list = ["navneet", "reddy vanga", "mahommad bin laden"];

  const [list, setList] = useState([]);
  const [bId, setBId] = useState("");
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    console.log(branch);
    if (branch?.name) {
      setBranchName(branch?.name);
    }
    if (branch?.code) {
      setBatchCode(branch.code);
    }
    if (branch?.id) {
      setBId(branch?.id);
    }

    if (branch?.course?.branch?.id) {
      setBranchId(branch.course.branch.id);
    }
    if (branch?.course?.id) {
      setCourseId(branch.course.id);
    }
  }, [branch]);

  // const [branchId,setBranchId] = useState(branch?.id || "")
  const { fetchBranch, fetchCourse } = useManagement();

  const [branchname, setBranchName] = useState(branch?.name || "");
  const [branchAdmin, setBranchAdmin] = useState(branch?.branchAdmin || "");
  const [batchcode, setBatchCode] = useState(branch?.code || "");
  const [branchId, setBranchId] = useState(null);
  const [bname, setBname] = useState();

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const token = tok.data.token;

    const loadData = async () => {
      const data = await fetchBranch();

      setList(data);
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchCourse();
      const filterdata = data.filter((dat) => dat.branchId === branchId);
      setCourses(filterdata);
    };

    loadData();
  }, [branchId]);

  const addBranch = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user"));
      const token = tok.data.token;
      const { data } = await axios.post(
        `${mainRoute}/api/batch`,
        { name: branchname, code: batchcode, courseId: courseId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Batch Created");
      setOpen(false);
      await refetch();
    } catch (error) {
      toast.error("Error in creating batch");
      setOpen(false);
      router.refresh();
      await refetch();
    }
  };

  const assignBranch = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user"));
      const token = tok.data.token;

      const { data } = await axios.post(
        `${mainRoute}/api/users/make-branch-admin`,
        {
          name: branchname,
          courseId: courseId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Batch Created");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in assigning branch admin");
      setOpen(false);
      // router.refresh();
      await refetch();
      return;
    }
  };

  const editBranch = async () => {
    try {
      const tokn = JSON.parse(localStorage.getItem("user"));
      const token = tokn.data.token;

      const { data } = await axios.put(
        `${mainRoute}/api/batch/${branch.id}`,
        {
          name: branchname,
          branchId: courseId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Edited successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in editing branch");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  const deleteBranch = async () => {
    try {
      const tokn = JSON.parse(localStorage.getItem("user"));
      const token = tokn.data.token;

      const { data } = await axios.delete(`${mainRoute}/api/batch/${bId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Deleted Successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in deleting branch");
      setOpen(false);
      // router.refresh();
      await refetch();
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center ">
          <div className="h-auto p-5 xl:w-[40vw] bg-white shadow-2xl rounded-2xl border border-stone-200  ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <h2 className="px-5 pb-3 text-xl font-semibold text-maroon-800">
              {{ add: "Add", create: "Create", assign: "Assign", edit: "Edit", delete: "Delete" }[type] || ""} Batch
            </h2>
            {type === "add" && (
              <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label htmlFor="branchname">Batch Name</Label>
                  <Input
                    id="branchname"
                    onChange={(e) => setBranchName(e.target.value)}
                    type={`text`}
                    placeholder={"Batch Name"}
                  />
                </div>
                {/* <div className="">
                  <Label htmlFor="batchcode">Batch Code</Label>
                  <Input
                    id="batchcode"
                    onChange={(e) => setBatchCode(e.target.value)}
                    type={`text`}
                    placeholder={"Batch Code"}
                  />
                </div> */}

                <div className="">
                  <Label htmlFor="branchId">Branch</Label>
                  <Select onValueChange={(v) => setBranchId(v)} id="branchId">
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="">
                  <Label htmlFor="courseId">Course</Label>
                  <Select onValueChange={(v) => setCourseId(v)} id="courseId">
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* <div>
                  <Label htmlFor="branchadmin">Branch Admin</Label>
                  <Select onValueChange={(v)=>setBranchAdmin(v)} id="branchadmin">
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder="Branch Admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                <Button onClick={addBranch}>Add New Batch</Button>
              </div>
            )}

            {type === "assign" && (
              <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label htmlFor="branchname">Branch Name</Label>
                  <Input
                    id="branchname"
                    type={`text`}
                    value={branch?.name}
                    onChange={(e) => setBranchName(e)}
                    placeholder={"Branch Name"}
                  />
                </div>
                <div>
                  <Label htmlFor="branchadmin">Branch Admin</Label>
                  <Select
                    onValueChange={(v) => setBranchAdmin(v)}
                    id="branchadmin"
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue
                        placeholder={branchAdmin || "Branch Admin"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={assignBranch}>Assign Branch Admin</Button>
              </div>
            )}

            {type === "edit" && (
              <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label htmlFor="branchname">Batch Name</Label>
                  <Input
                    id="branchname"
                    onChange={(e) => setBranchName(e.target.value)}
                    type={`text`}
                    placeholder={"Batch Name"}
                    value={branchname}
                  />
                </div>
                {/* <div className="">
                  <Label htmlFor="batchcode">Batch Code</Label>
                  <Input
                    id="batchcode"
                    onChange={(e) => setBatchCode(e.target.value)}
                    type={`text`}
                    placeholder={"Batch Code"}
                    value={batchcode}
                  />
                </div> */}

                <div className="">
                  <Label htmlFor="branchId">Branch</Label>
                  <Select
                    value={branchId}
                    onValueChange={(v) => setBranchId(v)}
                    id="branchId"
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="">
                  <Label htmlFor="courseId">Course</Label>
                  <Select
                    value={courseId}
                    onValueChange={(v) => setCourseId(v)}
                    id="courseId"
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={editBranch}>Edit Batch</Button>
              </div>
            )}

            {type === "delete" && (
              <>
                <div className="h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <p className="">
                    You Want To Delete{" "}
                    <span className="font-bold text-2xl text-red-600">
                      {branch.name}
                    </span>{" "}
                    Batch
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

export default BatchModels;
