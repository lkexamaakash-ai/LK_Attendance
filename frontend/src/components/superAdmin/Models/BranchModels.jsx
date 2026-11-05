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
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const BranchModels = ({ open, type, setOpen, branch, badmin,refetch }) => {
  // const list = ["navneet", "reddy vanga", "mahommad bin laden"];
  const router = useRouter();

  const [list, setList] = useState([]);

  // const [branchId,setBranchId] = useState(branch?.id || "")

  const [branchname, setBranchName] = useState(branch?.name || "");
  const [branchAdmin, setBranchAdmin] = useState(branch?.branchAdmin || "");

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const token = tok.data.token;

    const fetchUser = async () => {
      const { data } = await axios.get(`${mainRoute}/api/users/allusers`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setList(data.data);
    };

    fetchUser();
  }, []);

  const addBranch = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user"));
      const token = tok.data.token;
      const { data } = await axios.post(
        `${mainRoute}/api/branch`,
        { name: branchname, userId: branchAdmin },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Branch Added Successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in adding branch");
      setOpen(false);
      // router.refresh();
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
          userId: branchAdmin,
          branchId: branch.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Branch Admin Assigned Successfully");
      setOpen(false);
      // router.refresh();
      await refetch();
    } catch (err) {
      toast.error("Error in assigning branch admin");
      setOpen(false);
      router.refresh();
      await refetch();
    }
  };

  const editBranch = async () => {
    try {

      const tokn = JSON.parse(localStorage.getItem("user"));
      const token = tokn.data.token;

      const { data } = await axios.put(
        `${mainRoute}/api/branch/${branch.id}`,
        {
          name: branchname,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Branch Edited Successfully");
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

      const { data } = await axios.delete(
        `${mainRoute}/api/branch/${branch.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Branch Deleted Successfully");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Error in deleting branch");
      setOpen(false);
      router.refresh();
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
              {{ add: "Add", create: "Create", assign: "Assign", edit: "Edit", delete: "Delete" }[type] || ""} Branch
            </h2>
            {type === "add" && (
              <div className=" h-full w-full flex flex-col justify-center px-10 gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 ">
                <div className="">
                  <Label htmlFor="branchname">Branch Name</Label>
                  <Input
                    id="branchname"
                    onChange={(e) => setBranchName(e.target.value)}
                    type={`text`}
                    placeholder={"Branch Name"}
                  />
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

                <Button onClick={addBranch}>Add New Branch</Button>
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
                  <Label htmlFor="branchname">Branch Name</Label>
                  <Input
                    id="branchname"
                    type={`text`}
                    value={branchname}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder={"Branch Name"}
                  />
                </div>
                <div>
                  <Label htmlFor="branchadmin">Branch Admin</Label>
                  {/* <Select id="branchadmin" >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={badmin.name || "Branch Admin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {list.map((item, index) => (
                        <SelectItem value={item.id} key={index}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                  <Input
                    type={`text`}
                    value={badmin?.name || "No Branch Admin Assigned"}
                    readOnly
                  />
                </div>

                <Button onClick={editBranch}>Edit Branch</Button>
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
                    Branch
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

export default BranchModels;
