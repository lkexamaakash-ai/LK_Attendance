import React, { useEffect, useState } from "react";
import UploadFile from "./Models/UploadFile";
import { Button } from "../ui/button";
import axios from "axios";
import { mainRoute } from "../apiroute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useManagement } from "@/context/ManagementContext";
import UploadFileStaff from "./Models/UploadFileStaff";

const HistoricalData = () => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [role, setRole] = useState("FACULTY");
  const [branch, setBranch] = useState([]);
  const [bId, setBId] = useState(1);
  const [userId, setUserId] = useState(null);

  const [op, setOp] = useState(false);

  //   alert(year)

  const list = [
    "Date",
    "Session",
    "Faculty Name",
    "Phone",
    "Batch",
    "Subject",
    "InTime",
    "OutTime",
    "Total",
    "Penalty",
  ];

  const list2 = [
    "Date",
    "Branch name",
    "Staff name",
    "Shift Start",
    "Shift End",
    "Over Hours",
    "Deficit Hours",
  ];

  const formatTime = (isoTime) => {
    return new Date(isoTime).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateYYYYDDMM = (isoDate) => {
    const d = new Date(isoDate);

    const year = d.getFullYear();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");

    return `${year}-${day}-${month}`;
  };

  const [open, setOpen] = useState(false);
  const [Hdata, setHData] = useState([]);

  const fetchHistory = async () => {
    const token = JSON.parse(localStorage.getItem("user")).data.token;

    const { data } = await axios.get(
      `${mainRoute}/api/upload/data?month=${
        month + 1
      }&year=${year}&id=${bId}&role=${role}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if(userId){
      const filterdata = data.data.filter((us) => us.userId === userId);
  
      setHData(filterdata);
    }else{
      setHData(data.data)
    }
  };

  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  let cYear = new Date().getFullYear();

  const years = Array.from(
    {
      length: cYear - 2024 + 1,
    },
    (_, i) => 2024 + i
  );

  //   console.log(years)

  const { fetchBranch, fetchUser } = useManagement();
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchUser();

      console.log(data);

      const filterData = data.filter((use) => use.role === "FACULTY");

      setUsers(filterData);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchBranch();
      setBranch(data);
    };
    loadData();
  }, []);
  return (
    <>
      <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden gap-5 p-4 py-6 flex-wrap ">
        <div className="w-full flex items-center justify-between">
          <div className="flex gap-2">
            <Select value={month} onValueChange={(v) => setMonth(v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Month`} />
              </SelectTrigger>
              <SelectContent>
                {mon.map((item, i) => (
                  <SelectItem key={i} value={i}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => setYear(v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Year`} />
              </SelectTrigger>
              <SelectContent>
                {years.map((item, i) => (
                  <SelectItem key={i} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bId} onValueChange={(v) => setBId(v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Role`} />
              </SelectTrigger>
              <SelectContent>
                {branch.map((item, i) => (
                  <SelectItem key={i} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
                {/* <SelectItem value={`STAFF`}>Staff</SelectItem> */}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Role`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={`FACULTY`}>Faculty</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchHistory} className={`cursor-pointer`}>
              Apply
            </Button>

            <Select onValueChange={(v) => setUserId(v)}>
              <SelectTrigger>
                <SelectValue placeholder={`Role`} />
              </SelectTrigger>
              <SelectContent>
                {users.map((item, i) => (
                  <SelectItem key={i} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
                <SelectItem value={null}>NONE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className={`bg-maroon-700 text-white hover:bg-maroon-800 cursor-pointer `}
              onClick={() => {
                setOpen(true);
              }}
            >
              Add Faculty History Data
            </Button>
          </div>
        </div>
        <div className="w-full h-[91%] overflow-y-auto overflow-x-auto xl:overflow-x-hidden pb-10">
          <ul
            className={`grid grid-cols-[100px_180px_130px_220px_140px_140px_120px_100px_120px_100px]  ${
              role === "FACULTY" ? "xl:grid-cols-10" : "xl:grid-cols-7"
            } px-4 py-3   font-semibold rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 text-center`}
          >
            {role === "FACULTY" &&
              list.map((item, i) => <li key={i}>{item}</li>)}
            {role === "STAFF" &&
              list2.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
          {Hdata.length > 0 ? (
            Hdata.map((item, i) => (
              <ul
                key={i}
                className={`border-b border-stone-200 text-slate-700 transition-colors grid  grid-cols-[100px_180px_130px_220px_140px_140px_120px_100px_120px_100px] xl:grid-cols-${list.length} px-4 py-3   text-center items-center hover:bg-maroon-50/70`}
              >
                <li>{formatDateYYYYDDMM(item.date)}</li>
                <li>{item?.session}</li>
                <li>{item?.user?.name}</li>
                <li>{item?.user?.phoneNumber}</li>
                <li>{item?.batch?.name}</li>
                <li>{item?.subject}</li>
                <li>{formatTime(item?.Intime)}</li>
                <li>{formatTime(item?.Outtime)}</li>
                <li>{(item?.totalMinutes / 60).toFixed(2)}</li>
                <li>
                  {item?.totalMinutes < 120
                    ? 120 - item.totalMinutes > 15
                      ? 120 - item.totalMinutes
                      : 0
                    : 0}
                </li>
              </ul>
            ))
          ) : (
            <div className="flex justify-center items-center h-[91%]">
              <h1 className="text-5xl">No Data Found</h1>
            </div>
          )}
        </div>
      </div>
      <UploadFile open={open} setOpen={setOpen} refetch={fetchHistory} />
      <UploadFileStaff open={op} setOpen={setOp} refetch={fetchHistory} />
    </>
  );
};

export default HistoricalData;
