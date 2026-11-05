"use client";
import React, { useState } from "react";
import { MoreVertical, Pencil, TimerReset, Trash2 } from "lucide-react";

const itemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-maroon-50 hover:text-maroon-800";

const ActionBtn = ({ op, setOp, type, setType, lecu, setlecture, need, setReset }) => {
  const [open, setOpen] = useState(false);

  const handleEdit = () => {
    setlecture(lecu);
    setOp(true);
    setType("edit");
    setOpen(false);
    setReset(false);
  };

  const handleDelete = () => {
    setlecture(lecu);
    setOp(true);
    setType("delete");
    setOpen(false);
  };
  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Actions"
          className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
        >
          <MoreVertical size={16} />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 text-left shadow-lg">
            <button onClick={handleEdit} className={itemClass}>
              <Pencil size={15} /> Edit
            </button>

            {need && (
              <button
                onClick={() => {
                  setOpen(false);
                  handleEdit();
                  // setUs(user);
                  setType("edit");
                  setOp(true);
                  setReset(true);
                }}
                className={itemClass}
              >
                <TimerReset size={15} /> Reset
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 border-t border-stone-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ActionBtn;
