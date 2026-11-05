"use client";
import EmptyState from "@/components/layout/EmptyState";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import BranchModels from "./Models/BranchModels";
import axios from "axios";
import { mainRoute } from "../apiroute";

const BranchManagement = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [bran, setBran] = useState({});
  const [badmin, setBadmin] = useState("");

  const lists = [
    "S.no",
    "Branch Name",
    "Total Faculties",
    "Total Staff",
    "Branch Admin",
    "Assign",
    "Edit",
    "Delete",
  ];

  const [branches, setBranches] = useState([]);

  const fetchBranches = async () => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const token = tok.data.token;
    const { data } = await axios.get(`${mainRoute}/api/branch`, {
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
      <div className="h-full bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center p-4 py-6 overflow-hidden">
        <div className="w-full flex items-center justify-end">
          <Button
            variant="secondary"
            className={`bg-maroon-700 text-white hover:bg-maroon-800 `}
            onClick={() => {
              setOpen(true);
              setType("add");
            }}
          >
            Add Branch
          </Button>
        </div>
        <div className="w-full">
          <ul className="grid grid-cols-8 xl:px-4 text-sm py-3 border border-maroon-100 bg-maroon-50 text-maroon-800 rounded-lg font-semibold text-center">
            {lists.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {branches.length > 0 ? (
            branches.map((branche, index) => {
              const branchAdmin = branche?.users?.find(
                (user) => user.role === "BRANCH_ADMIN",
              );

              // console.log(branche);

              return (
                <ul
                  key={branche.id}
                  className="grid grid-cols-8 text-sm xl:text-[1rem] px-4 py-3 border-b border-stone-200 text-center items-center text-slate-700 transition-colors hover:bg-maroon-50/70"
                >
                  <li className="font-semibold">{index + 1}</li>
                  <li>{branche.name}</li>

                  <li>
                    {branche?.facultyBranches?.length}
                  </li>

                  <li>
                    {branche.users.filter((u) => u.role === "STAFF").length}
                  </li>

                  <li>{branchAdmin ? branchAdmin.name : "-"}</li>

                  <li>
                    <Button
                      size="sm"
                      onClick={() => {
                        setOpen(true);
                        setType("assign");
                        setBran(branche);
                      }}
                      className={`scale-[0.6] xl:scale-[1]`}
                    >
                      Assign
                    </Button>
                  </li>

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
            <EmptyState message="No Branches" />
          )}
        </div>
      </div>

      <BranchModels
        open={open}
        refetch={fetchBranches}
        setOpen={setOpen}
        type={type}
        branch={bran}
        badmin={badmin}
      />
    </>
  );
};

export default BranchManagement;
