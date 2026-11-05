"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useManagement } from "@/context/ManagementContext";

const Profile = () => {
  const { fetchUser, changePassword } = useManagement();

  const [users, setUser] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user.data.user.id;
    const loadData = async () => {
      const userdata = await fetchUser();
      const filteruser = userdata.find((user) => user.id === userId);
      setUser(filteruser);
    };

    loadData();
  }, []);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const [oldPass, setOldPass] = useState(null);
  const [newPass, setNewPass] = useState(null);

  const handleChange = async () => {
    const data = await changePassword(users.id, newPass, oldPass);

    if (data.data === "wrong pass") {
      alert("Something went wrong");
    } else {
      setNewPass("");
      setOldPass("");
      alert("Password Changed");
    }
  };

  const formatRole = (role) => {
    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <div className="h-full p-3 bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden gap-5 [&>div]:p-5 [&>div]:rounded [&>div]:shadow-lg  [&>div]:bg-gray-100 [&>div>h1]:text-3xl [&>div>h1]:font-semibold [&>div>ul]:pl-10 [&>div>ul]:my-5 [&>div>ul>li]:font-bold  [&>div>ul>li>span]:font-normal  ">
      <div className="">
        <h1>Personal Information</h1>
        <ul>
          <li>
            Name: <span>{users?.name}</span>
          </li>
          <li>
            Phone Number: <span>{users?.phoneNumber}</span>
          </li>
        </ul>
      </div>

      <div className="">
        <h1>Academic Information</h1>
        <ul>
          <li>
            Role: <span>{users?.role}</span>
          </li>
          <li>
            Joining Date: <span>{formatDate(users.createdAt)}</span>
          </li>
        </ul>
      </div>

      <div className="">
        <h1 className="mb-2">Change Password</h1>
        <div className="flex flex-col xl:w-2/3 gap-5 ">
          <div className="flex gap-2">
            <Input
              onChange={(e) => setOldPass(e.target.value)}
              type={`text`}
              placeholder={`Enter Old Password`}
            />
            <Input
              onChange={(e) => setNewPass(e.target.value)}
              type={`text`}
              placeholder={`Enter New Password`}
            />
          </div>
          <Button onClick={handleChange}>Change</Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
