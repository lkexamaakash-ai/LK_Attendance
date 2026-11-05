import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import React from "react";

const DeleteModal = ({ open, setOpen, handleDelete, id }) => {
  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="flex w-[90%] max-w-md flex-col items-center gap-5 rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-2xl">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Confirm lecture delete?
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex w-full items-center justify-center gap-3">
              <Button
                className="flex-1 cursor-pointer"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                variant="destructive"
                onClick={() => handleDelete(id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteModal;
