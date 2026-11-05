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
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const CourseModels = ({ open, setOpen, type, course, refetch }) => {
  const [branchs, setBranchs] = useState();
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [courseId, setCourseId] = useState("");

  const { fetchBranch } = useManagement();

  useEffect(() => {
    if (type === "add") {
      setName("");
      setBranchId("");
      setCourseId("");
    }

    if ((type === "edit" || type === "delete") && course) {
      setName(course?.name ?? "");
      setBranchId(course?.branchId ?? "");
      setCourseId(course?.id ?? "");
    }
  }, [type, course]);

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      const data = JSON.parse(localStorage.getItem("user")).data.user.branch;
      setBranchs(data);
    };
    loadData();
  }, [open]);

  const addCourse = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user")).data.token;
      const { data } = await axios.post(
        `${mainRoute}/api/courses/`,
        {
          name,
          branchId:branchs.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
        }
      );

      toast.success("Course created successfully");
      await refetch();
      setOpen(false);
    } catch (err) {
      toast.error("Something went wrong");
      await refetch();
      setOpen(false);
    }
  };

  const editCourse = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user")).data.token;
      if (name === course?.name && branchId === course?.branchId) {
        toast.warning("No Changes");
        setOpen(false);
        return;
      }

      const { data } = await axios.put(
        `${mainRoute}/api/courses/${courseId}`,
        {
          name,
          branchId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
        }
      );

      toast.success("Course Updated successfully");
      await refetch();
      setOpen(false);
    } catch (err) {
      toast.error("Something went wrong");
      await refetch();
      setOpen(false);
    }
  };

  const deleteBranch = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user")).data.token;
      const { data } = await axios.delete(
        `${mainRoute}/api/courses/${courseId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok}`,
          },
        }
      );

      toast.success("Course Deleted successfully");
      await refetch();
      setOpen(false);
    } catch (err) {
      toast.error("Something went wrong");
      await refetch();
      setOpen(false);
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
                onClick={() => {
                  setOpen(false);
                  setBranchId("");
                  setName("");
                }}
              >
                ✕
              </span>
            </div>
            <h2 className="px-5 pb-3 text-xl font-semibold text-maroon-800">
              {{ add: "Add", create: "Create", assign: "Assign", edit: "Edit", delete: "Delete" }[type] || ""} Course
            </h2>
            {type === "add" && (
              <>
                <h1 className="text-lg font-semibold uppercase">
                  Create Course
                </h1>
                <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                  <div className="">
                    <Label htmlFor="coursename">Course Name</Label>
                    <Input
                      value={name}
                      id={"coursename"}
                      onChange={(e) => setName(e.target.value)}
                      type={`text`}
                      placeholder={"Course Name"}
                    />
                  </div>

                  <div className="">
                    <Label htmlFor={`branch`}>Branch</Label>
                    <Input
                      placeholder={"Branch"}
                      value={branchs?.name}
                      readOnly
                    />
                  </div>
                  <Button onClick={addCourse}>Add New Course</Button>
                </div>
              </>
            )}

            {type === "edit" && (
              <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <h1 className="text-lg font-semibold uppercase">Edit Course</h1>
                <div className="">
                  <Label htmlFor="coursename">Course Name</Label>
                  <Input
                    id={"coursename"}
                    onChange={(e) => setName(e.target.value)}
                    type={`text`}
                    placeholder={"Course Name"}
                    value={name}
                  />
                </div>

                <div className="">
                  <Label htmlFor={`branch`}>Branch</Label>
                  <Input placeholder={"Branch"} value={branchs.name} readOnly />
                </div>
                <Button onClick={editCourse}>Edit Course</Button>
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
                    Course
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

export default CourseModels;
