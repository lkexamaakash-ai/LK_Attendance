"use client";
import EmptyState from "@/components/layout/EmptyState";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import BranchModels from "./Models/BranchModels";
import axios from "axios";
import { mainRoute } from "../apiroute";
import BatchModels from "./Models/BatchModels";

const BatchManagement = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [bran, setBran] = useState({});
  const [badmin, setBadmin] = useState("");

  const lists = [
    "S.no",
    "Batch Name",
    "Course Name",
    "Branch Name",
    "Total Lectures",
    "Edit",
    "Delete",
  ];

  const [branches, setBranches] = useState([]);

  const fetchBranches = async () => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const token = tok.data.token;
    const { data } = await axios.get(`${mainRoute}/api/batch`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    setBranches(data.data);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <>
      {/* <div className="h-full w-full p-4 py-6 flex flex-wrap gap-5 flex-col items-center "> */}
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
            Add Batch
          </Button>
        </div>
        <div className="w-full h-[91%] overflow-y-auto overflow-x-auto xl:overflow-x-hidden pb-10">
          <ul className="grid grid-cols-7 xl:px-4 text-sm py-3 border border-maroon-100 bg-maroon-50 text-maroon-800 rounded-lg font-semibold text-center">
            {lists.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {branches.length > 0 ? (
            branches.map((branche, index) => {
              console.log(branche)
              const branchAdmin = branche?.course?.branch?.users?.find(
                (user) => user.role === "BRANCH_ADMIN"
              );
              return (
                <ul
                  key={branche.id}
                  className="grid grid-cols-7 text-sm xl:text-[1rem] px-4 py-3 border-b border-stone-200 text-center items-center text-slate-700 transition-colors hover:bg-maroon-50/70"
                >
                  <li className="font-semibold">{index + 1}</li>
                  <li>{branche.name}</li>

                  {/* <li>
                    {branche?.branch?.users?.filter((u) => u.role === "FACULTY")
                      .length || 0}
                  </li>

                  <li>
                    {branche?.branch?.users?.filter((u) => u.role === "STAFF")
                      .length || 0}
                  </li> */}
                  <li>{branche?.course?.name}</li>
                  <li>{branche?.course?.branch?.name}</li>

                  <li>{(branche?.lectureSchedules?.reduce((sum,lec) => sum + lec?.TotalScheduled,0)) ||"-"}</li>

                  

                  <li>
                    <Button
                      onClick={() => {
                        setType("edit");
                        setBran(branche);
                        setOpen(true);
                        setBadmin(branchAdmin);
                      }}
                      size="sm"
                      variant="secondary"
                      className={`scale-[0.6] xl:scale-[1]`}
                    >
                      Edit
                    </Button>
                  </li>

                  <li>
                    <Button
                      onClick={() => {
                        setType("delete");
                        setBran(branche);
                        setOpen(true);
                        setBadmin(branchAdmin);
                      }}
                      size="sm"
                      variant="destructive"
                      className={`scale-[0.6] xl:scale-[1]`}
                    >
                      Delete
                    </Button>
                  </li>
                </ul>
              );
            })
          ) : (
            <div className="h-[50vh] flex justify-center items-center">
              <EmptyState message="No Batches" />
            </div>
          )}
        </div>
      </div>

      <BatchModels
        refetch={fetchBranches}
        open={open}
        setOpen={setOpen}
        type={type}
        branch={bran}
        badmin={badmin}
      />
    </>
  );
};

export default BatchManagement;
