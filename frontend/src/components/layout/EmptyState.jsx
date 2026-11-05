import { Inbox } from "lucide-react";

// Shown in place of a table or list when there is nothing to display.
const EmptyState = ({ message = "Nothing here yet" }) => (
  <div className="flex w-full flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex size-16 items-center justify-center rounded-full bg-maroon-50 text-maroon-300">
      <Inbox className="size-8" />
    </div>
    <p className="text-lg font-semibold text-slate-800">{message}</p>
    <p className="text-sm text-slate-500">Nothing to show here yet.</p>
  </div>
);

export default EmptyState;
