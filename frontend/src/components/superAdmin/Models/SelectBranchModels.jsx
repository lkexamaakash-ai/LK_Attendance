import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const SelectBranchModels = ({ open, setOpen, userdata,list ,currentMon }) => {
  const [lecture, setLecture] = useState([]);

  const [totalLecture, setTotalLecture] = useState(null);
  const [ConductedLecture, setConductedLecture] = useState(null);
  const [batch, setBatch] = useState({});
  const [branch, setBranch] = useState({});
  const [sub,setSub] = useState(null)

  const handleChange = async (v) => {
    console.log(v)
    let totalScheduled = v?.TotalScheduled;
    let conducted = v.attendance.filter((a) => a.status === "CONDUCTED").length;

    setTotalLecture(totalScheduled);
    setConductedLecture(conducted);
    setBatch(v?.batch);
    setBranch(v?.batch?.course?.branch);
    setSub(v?.subject?.name)
  };

  const handleLectureBasedFacultySendWhatsappMsg = () => {
    const faculty = userdata;

    const subjectName = faculty?.lectures?.[0]?.subject?.name || "N/A";
    const totalScheduled =
      faculty?.lectures?.reduce(
        (sum, lec) => sum + (lec?.TotalScheduled || 0),
        0
      ) || 0;

    const conductedLectures =
      faculty?.lectures?.reduce(
        (sum, lec) => sum + (lec?.attendance?.length || 0),
        0
      ) || 0;

    const remainingLectures = totalScheduled - conductedLectures;
    const lectureRate = faculty?.lectureRate || 0;
    const totalPayout = conductedLectures * lectureRate;

    const message = `
      Dear *${userdata.name}*, In ${
      batch.course.name
    } Course ${batch} Batch For *${sub}*, *${totalLecture}* ${
      totalLecture > 1 ? "lectures" : "lecture"
    } were allocated. As of ${
      list[currentMon]
    }, *${conductedLectures}* have been completed, leaving ${totalLecture-conductedLectures} lectures pending at ${
      branch?.name
    } Branch. Kindly ensure the pending lectures are completed within the given timeline so that the syllabus remains on track. Thank you for your cooperation. Best regards, *Academic Coordinator*
    `.trim();

    const whatsappURL = `https://wa.me/${
      userdata.phoneNumber
    }/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  useEffect(() => {
    if (userdata?.lectures) {
      setLecture(userdata?.lectures);
    }
  }, [userdata]);
  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="z-10 min-h-[50vh] max-h-[70vh] p-5 xl:w-[35vw] w-[90%] bg-white shadow-2xl rounded-2xl border border-stone-200 overflow-hidden "
          >
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => setOpen(false)}
              >
                ✕
              </span>
            </div>
            <h1 className="font-semibold uppercase">
              Select Lecture to send Whatsapp Messages
            </h1>
            <div className="flex flex-col gap-2 mt-5">
              <div className="">
                <Select onValueChange={(v) => handleChange(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select lecture`} />
                  </SelectTrigger>
                  <SelectContent>
                    {lecture.map((item, i) => (
                      <SelectItem value={item} key={i}>
                        {item?.subject?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="">
                <Input value={branch?.name} readOnly placeholder={"Branch"} />
              </div>

              <div className="">
                <Input value={batch?.name} readOnly placeholder={"Batch"} />
              </div>

              <div className="">
                <Input
                  value={totalLecture}
                  readOnly
                  placeholder={"Total Lecture Scheduled"}
                />
              </div>

              <div className="">
                <Input
                  value={totalLecture - ConductedLecture}
                  readOnly
                  placeholder={"Lecture Remaining"}
                />
              </div>

              <Button
              onClick={handleLectureBasedFacultySendWhatsappMsg}
                className={`w-full mt-5 cursor-pointer bg-maroon-700 text-white hover:bg-maroon-800 mx-auto`}
              >
                <Image
                  src={"/whatsapp.png"}
                  alt="whatsapp"
                  height={100}
                  width={100}
                  className="h-5 w-5"
                />
                Whatsapp
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectBranchModels;
