"use client";
import EmptyState from "@/components/layout/EmptyState";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import ActionButton from "./ActionButton";
import UserModal from "./Models/UserModal";
import axios from "axios";
import { mainRoute } from "../apiroute";
import ChangePass from "./Models/ChangePass";

const ROLE_ORDER = { SUPER_ADMIN: 0, BRANCH_ADMIN: 1, FACULTY: 2, STAFF: 3 };

const UserManagement = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [us, setUs] = useState({});

  const [users, setUser] = useState([]);
  const [changepass,setChangePass] = useState(false)

  // key: the column can be sorted by clicking its heading
  const columns = [
    { label: "S.no" },
    { label: "Name", key: "name" },
    { label: "Phone Number" },
    { label: "Role", key: "role" },
    { label: "Branch", key: "branch" },
    { label: "Salary", key: "salary" },
    { label: "Created On", key: "createdAt" },
    { label: "Actions" },
  ];

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [sort, setSort] = useState({ key: "role", dir: "asc" });

  const fetchUser = async () => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;
    const { data } = await axios.get(`${mainRoute}/api/users/allusers`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // all users except yourself. The Status filter decides whether active or inactive ones are shown.
    setUser(data.data.filter((user) => user.id !== tok.data.user.id));
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

  // a faculty can teach in more than one branch
  const branchNamesOf = (user) => {
    if (user.role === "FACULTY" && user.branchId == null) {
      return (user.facultyBranches || []).map((item) => item.branch?.name).filter(Boolean);
    }
    return user.branch?.name ? [user.branch.name] : [];
  };

  const salaryOf = (user) => {
    const v = user.facultyType === "LECTURE_BASED" ? user.lectureRate : user.salary;
    return v === null || v === undefined || v === "" ? null : Number(v);
  };

  const branchOptions = useMemo(
    () => [...new Set(users.flatMap(branchNamesOf))].sort((a, b) => a.localeCompare(b)),
    [users],
  );

  const visible = useMemo(() => {
    const text = q.trim().toLowerCase();
    const list = users.filter((u) => {
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "INACTIVE" && u.isActive) return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (branchFilter !== "ALL" && !branchNamesOf(u).includes(branchFilter)) return false;
      if (text && !(u.name?.toLowerCase().includes(text) || String(u.phoneNumber || "").includes(text))) return false;
      return true;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
    const compare = (a, b) => {
      switch (sort.key) {
        case "name":
          return byName(a, b) * dir;
        case "role":
          return ((ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)) * dir || byName(a, b);
        case "branch":
          return branchNamesOf(a).join(", ").localeCompare(branchNamesOf(b).join(", ")) * dir || byName(a, b);
        case "salary": {
          const x = salaryOf(a);
          const y = salaryOf(b);
          if (x === null && y === null) return byName(a, b);
          if (x === null) return 1; // users without a salary always go last
          if (y === null) return -1;
          return (x - y) * dir || byName(a, b);
        }
        case "createdAt":
          return (new Date(a.createdAt) - new Date(b.createdAt)) * dir || byName(a, b);
        default:
          return 0;
      }
    };
    return list.sort(compare);
  }, [users, q, roleFilter, branchFilter, statusFilter, sort]);

  const filtersOn = q || roleFilter !== "ALL" || branchFilter !== "ALL" || statusFilter !== "ACTIVE";
  const clearFilters = () => {
    setQ("");
    setRoleFilter("ALL");
    setBranchFilter("ALL");
    setStatusFilter("ACTIVE");
  };

  const clickSort = (key) =>
    setSort((cur) =>
      cur.key === key ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "createdAt" ? "desc" : "asc" },
    );

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
          <div className="flex w-full flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or phone number"
                className="h-10 w-full rounded-md border border-stone-300 pl-9 pr-3 text-sm outline-none focus:border-maroon-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              aria-label="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="BRANCH_ADMIN">Branch Admin</option>
              <option value="FACULTY">Faculty</option>
              <option value="STAFF">Staff</option>
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              aria-label="Filter by branch"
            >
              <option value="ALL">All branches</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm"
              aria-label="Filter by status"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">Active and inactive</option>
            </select>
            {filtersOn && (
              <button onClick={clearFilters} className="cursor-pointer text-sm font-medium text-maroon-700 hover:underline">
                Clear filters
              </button>
            )}
            <Button
              variant="secondary"
              className={`ml-auto bg-maroon-700 text-white hover:bg-maroon-800 `}
              onClick={() => {
                setOpen(true);
                setType("add");
              }}
            >
              Add New User
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Showing {visible.length} of {users.length} users. Click a column heading to sort.
          </p>
          <ul className="grid grid-cols-[60px_180px_260px_220px_140px_140px_120px_100px] xl:grid-cols-8 w-full px-4 py-3 mt-3 rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 font-semibold text-center">
            {columns.map((col, index) => (
              <li key={index}>
                {col.key ? (
                  <button
                    onClick={() => clickSort(col.key)}
                    className="inline-flex cursor-pointer items-center justify-center gap-1 font-semibold hover:text-maroon-950"
                  >
                    {col.label}
                    {sort.key === col.key ? (
                      sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full pb-10">
          {visible.length > 0 ? (
            visible.map((user, index) => {
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
              <EmptyState message={users.length ? "No users match these filters" : "No Users"} />
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
