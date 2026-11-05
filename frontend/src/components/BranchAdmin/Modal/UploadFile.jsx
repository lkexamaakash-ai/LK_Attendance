import React, { useEffect, useState } from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import axios from "axios";
import { mainRoute } from "../../apiroute";
import { read } from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useManagement } from "@/context/ManagementContext";

const UploadFile = ({ open, setOpen, refetch }) => {
  const [isLoad,setIsLoad] = useState(false)
  const [bId, setBId] = useState(null);
  const [file, setFile] = useState(null);
  const [sheetNumber, setSheetNumber] = useState(0);
  const [sheetCounts, setSheetCount] = useState(0);
  const [branches, setBranches] = useState([]);

  const { fetchBranch } = useManagement();

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchBranch();
      console.log(data);
      setBranches(data);
    };
    loadData();

  }, []);

  const countSheetNumber = async (file) => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(new Uint8Array(arrayBuffer), {
      type: "array",
    });

    const sheetCount = workbook.SheetNames.length;
    setSheetNumber(sheetCount);
  };

  const uploadExcel = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setIsLoad(true)

    const formData = new FormData();
    formData.append("file", file);
    formData.append("branchId", bId);
    formData.append("sheetNumber", sheetCounts);

    // for (let pair of formData.entries()) {
    //   console.log(pair[0], pair[1]);
    // }

    const token = JSON.parse(localStorage.getItem("user")).data.token;

    const { data } = await axios.post(`${mainRoute}/api/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ Content-Type mat set karna
      },
    });
    setIsLoad(false);
    await refetch();
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-[80vh] p-5 xl:w-[40vw] w-[90%] bg-white shadow-2xl rounded-2xl border border-stone-200 overflow-hidden ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold mb-3 text-maroon-800">
                Add Historical Data
              </h1>
            </div>
            <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-5 p-4 py-6">
              <Label>Upload File</Label>

              <Input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  countSheetNumber(e.target.files[0]);
                }}
              />

              <Select onValueChange={(v)=>setSheetCount(v)}>
                <SelectTrigger className={`w-full`}>
                  <SelectValue placeholder={`Sheet Name`} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: sheetNumber }).map((_, i) => (
                    <SelectItem value={i} key={i}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={(v)=>setBId(v)}>
                <SelectTrigger className={`w-full`}>
                  <SelectValue placeholder={`Branch`} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((item, i) => (
                    <SelectItem value={item.id} key={i}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={isLoad} onClick={uploadExcel}>{isLoad?"Loading...":"Upload"}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadFile;
