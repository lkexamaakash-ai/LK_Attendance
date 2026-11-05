import EmptyState from "@/components/layout/EmptyState";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import CourseModels from "./Models/CourseModels";
import axios from "axios";
import { mainRoute } from "../apiroute";
import ActionBtn from "../BranchAdmin/ActionBtn";

const CourseManagement = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState({});

  const lists = [
    "S.no",
    "Couses Name",
    "No of Batches",
    "Branch Name",
    "Branch Admin",
    "Action",
  ];

  const fetchCourse = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user")).data.token;

      const { data } = await axios.get(`${mainRoute}/api/courses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
      });

      setCourses(data.data);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, []);

  return (
    <>
      <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden gap-5 p-4 py-6 flex-wrap ">
        <div className="w-full flex items-center justify-end">
          <Button
            variant="secondary"
            className={`bg-maroon-700 text-white hover:bg-maroon-800 `}
            onClick={() => {
              setOpen(true);
              setType("add");
            }}
          >
            Add Course
          </Button>
        </div>

        <div className="w-full h-[91%] overflow-y-auto overflow-x-auto xl:overflow-x-hidden pb-10">
          <ul
            className={`grid grid-cols-6 xl:px-4 text-sm py-3 border border-maroon-100 bg-maroon-50 text-maroon-800 rounded-lg font-semibold text-center`}
          >
            {lists.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {courses.length > 0 ? (
            courses.map((cour, i) => {
              console.log(cour.branch)
              return (
                <ul
                  key={i}
                  className={`grid grid-cols-6 text-sm xl:text-[1rem] px-4 py-3 border-b border-stone-200 text-center items-center text-slate-700 transition-colors hover:bg-maroon-50/70`}
                >
                    <li>{i + 1}</li>
                    <li>{cour?.name}</li>
                    <li>{cour?.batches?.length}</li>
                    <li>{cour?.branch?.name}</li>
                    <li>{cour?.branch?.users?.filter((user)=>user.role === "BRANCH_ADMIN").find((user)=>user.branchId === cour.branchId)?.name || "-"}</li>
                    <li>
                        <ActionBtn setOp={setOpen} setType={setType} lecu={cour} setlecture={setCourse} />
                    </li>
                </ul>
              );
            })
          ) : (
            <div className="h-[50vh] flex justify-center items-center">
              <EmptyState message="No Courses Created" />
            </div>
          )}
        </div>
      </div>

      <CourseModels open={open} setOpen={setOpen} course={course} type={type} refetch={fetchCourse} />
    </>
  );
};

export default CourseManagement;
