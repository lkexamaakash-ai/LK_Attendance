"use client";
import EmptyState from "@/components/layout/EmptyState";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import ActionButton from "./ActionButton";
import UserModal from "./Models/UserModal";
import axios from "axios";
import { mainRoute } from "../apiroute";
import ChangePass from "./Models/ChangePass";

const UserManagement = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [us, setUs] = useState({});

  const [users, setUser] = useState([]);
  const [changepass,setChangePass] = useState(false)

  const lists = [
    "S.no",
    "Name",
    "Phone Number",
    "Role",
    "Branch",
    "Salary",
    "Created On",
    "Actions",
  ];

  const fetchUser = async () => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;
    const { data } = await axios.get(`${mainRoute}/api/users/allusers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const filterdata = data.data.filter(
      (user) => user.id !== tok.data.user.id && user.isActive,
    );
    setUser(filterdata);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const formatRole = (role) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const ActivateUser = async (Id) => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;
    const { data } = await axios.put(
      `${mainRoute}/api/users/activate/${Id}`,
      {
        id: Id,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await fetchUser();
  };

  return (
    <>
      <div className="h-[93.25%] relative bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-5 p-4 pt-0 py-6 overflow-y-auto overflow-x-auto ">
        <div className="sticky top-0 bg-white z-10 pt-6">
          <div className="w-full flex items-center justify-end">
            <Button
              variant="secondary"
              className={`bg-maroon-700 text-white hover:bg-maroon-800 `}
              onClick={() => {
                setOpen(true);
                setType("add");
              }}
            >
              Add New User
            </Button>
          </div>
          <ul className="grid grid-cols-[60px_180px_260px_220px_140px_140px_120px_100px] xl:grid-cols-8 w-full px-4 py-3 mt-3 rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 font-semibold text-center">
            {lists.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="w-full pb-10">
          {users.length > 0 ? (
            users.map((user, index) => {
              if (
                user.id ===
                JSON.parse(localStorage.getItem("user")).data.user.id
              )
                return;

              return (
                <ul
                  key={index}
                  className={`grid grid-cols-[60px_180px_260px_220px_140px_140px_120px_100px] xl:grid-cols-8 px-4 py-3 border-b border-stone-200 text-center items-center text-slate-700 transition-colors hover:bg-maroon-50/70 ${user.isActive ? "bg-white" : "bg-gray-100"}`}
                >
                  <li className="font-semibold">{index + 1}</li>
                  <li className="flex items-center justify-center gap-2">
                    {user.name}{" "}
                    {!user.isActive && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        Inactive
                      </span>
                    )}
                  </li>
                  <li>{user.phoneNumber}</li>
                  <li>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        {
                          SUPER_ADMIN: "bg-gold-100 text-gold-600 ring-gold-200",
                          BRANCH_ADMIN: "bg-maroon-50 text-maroon-700 ring-maroon-100",
                          FACULTY: "bg-slate-100 text-slate-700 ring-slate-200",
                          STAFF: "bg-emerald-50 text-emerald-700 ring-emerald-100",
                        }[user.role] || "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {formatRole(user.role)}
                    </span>
                  </li>
                  {/* <li>{user.branch?.name || "-"}</li> */}
                  <li className=" min-w-0 wrap-break-word whitespace-normal">
                    {user.role === "FACULTY" ? user.branchId == null ? (
                      <>
                        {user.facultyBranches
                          .map((item) => item.branch.name)
                          .join(", ")}
                      </>
                    ): (
                      <>
                        {user?.branch?.name}
                      </>
                    ) : (
                      <>{user.branch?.name || "-"}</>
                    )}
                  </li>
                  <li>
                    {user.facultyType === "LECTURE_BASED"
                      ? user.lectureRate
                      : user.salary}
                  </li>
                  <li>{user.createdAt.split("T")[0]}</li>
                  <li className="flex justify-center">
                    {user.isActive ? (
                      <>
                        <ActionButton
                          user={user}
                          setUs={setUs}
                          setOp={setOpen}
                          type={type}
                          setType={setType}
                          changepass={true}
                          setChangePass={setChangePass}
                        />
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => {
                            ActivateUser(user.id);
                          }}
                          className={`cursor-pointer`}
                        >
                          Activate
                        </Button>
                      </>
                    )}
                  </li>
                </ul>
              );
            })
          ) : (
            <div className="h-[50vh] flex justify-center items-center">
              <EmptyState message="No Users" />
            </div>
          )}
        </div>
      </div>
      <UserModal
        open={open}
        setOpen={setOpen}
        type={type}
        user={us}
        refetch={fetchUser}
      />
      <ChangePass 
        changepass={changepass}
        setChangePass={setChangePass}
        user={us}
        refetch={fetchUser}
      />
    </>
  );
};

export default UserManagement;
