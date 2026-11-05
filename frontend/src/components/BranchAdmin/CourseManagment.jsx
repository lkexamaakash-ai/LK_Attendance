import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
// import CourseModels from "./Models/CourseModels";
import axios from "axios";
import { mainRoute } from "../apiroute";
import ActionBtn from "../BranchAdmin/ActionBtn";
import CourseModels from "./Modal/CourseModels";

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
      const token = JSON.parse(localStorage.getItem("user"));
      const tok = token.data.token;
      const branchId = token.data.user.branchId;

      const { data } = await axios.get(`${mainRoute}/api/courses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
      });
      const filterData = data.data.filter((co) => co.branchId === branchId)
      setCourses(filterData);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, []);

  return (
    <>
      <div className="h-full bg-white m-2 rounded flex flex-col items-center p-4 py-6 overflow-hidden">
        <div className="w-full flex items-center justify-end">
          <Button
            variant="secondary"
            className={`bg-green-600 text-gray-200 hover:bg-green-700 `}
            onClick={() => {
              setOpen(true);
              setType("add");
            }}
          >
            Add Course
          </Button>
        </div>

        <div className="w-full">
          <ul
            className={`grid grid-cols-6 xl:px-4 text-sm py-3 border-b border-gray-500 font-bold text-center`}
          >
            {lists.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {courses.length > 0 ? (
            courses.map((cour, i) => {
              return (
                <ul
                  key={i}
                  className={`grid grid-cols-6 text-sm xl:text-[1rem] px-4 py-3 border-b border-gray-500 text-center items-center hover:bg-gray-100`}
                >
                  <li>{i + 1}</li>
                  <li>{cour?.name}</li>
                  <li>{cour?.batches?.length}</li>
                  <li>{cour?.branch?.name}</li>
                  <li>
                    {cour?.branch?.users
                      ?.filter((user) => user.role === "BRANCH_ADMIN")
                      .find((user) => user.branchId === cour.branchId).name ||
                      "-"}
                  </li>
                  <li>
                    <ActionBtn
                      setOp={setOpen}
                      setType={setType}
                      lecu={cour}
                      setlecture={setCourse}
                    />
                  </li>
                </ul>
              );
            })
          ) : (
            <div className="h-[50vh] flex justify-center items-center">
              <p className="text-center my-5 text-xl">No Courses Created</p>
            </div>
          )}
        </div>
      </div>

      <CourseModels open={open} setOpen={setOpen} course={course} type={type} refetch={fetchCourse}  />
    </>
  );
};

export default CourseManagement;
