"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const StaffHeader = ({ title, setOpen }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);
  return (
    <div className="flex justify-between items-center px-10 py-1 border-b-[1] border-gray-400 bg-white rounded mx-2 mt-1 ">
      <p className="font-bold flex gap-4 items-center ">
        <Image
          onClick={() => setOpen(true)}
          className="cursor-pointer xl:hidden"
          src={`/more.png`}
          alt="more"
          width={20}
          height={5}
        />
        {title}
      </p>
      <div className="flex items-center gap-3">
        <Image
          src={"/user.png"}
          width={40}
          height={40}
          alt="user"
          className="rounded-full"
        />
        {user && (
          <p className="font-semibold">{user.data?.user.name || user.name}</p>
        )}
      </div>
    </div>
  );
};

export default StaffHeader;
