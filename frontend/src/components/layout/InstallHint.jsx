"use client";
import { Download, Share, X } from "lucide-react";
import React, { useEffect, useState } from "react";

// On phones, offers to add the site to the home screen (shown on the login page only).
const InstallHint = () => {
  const [mode, setMode] = useState(null); // "android" | "ios" | null
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    try {
      const installed = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      if (installed || localStorage.getItem("installHintDismissed") === "1") return;
    } catch {
      return;
    }

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      setMode("ios");
      return;
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem("installHintDismissed", "1");
    } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-maroon-100 bg-maroon-50/60 p-3 text-sm text-slate-700 lg:hidden">
      <div className="mt-0.5 text-maroon-700">{mode === "ios" ? <Share className="size-4" /> : <Download className="size-4" />}</div>
      <div className="flex-1">
        {mode === "ios" ? (
          <p>Add this app to your home screen: tap the <span className="font-semibold">Share</span> button, then <span className="font-semibold">Add to Home Screen</span>.</p>
        ) : (
          <>
            <p>Install the LK Academy app on your phone for quick access.</p>
            <button onClick={install} className="mt-2 cursor-pointer rounded-md bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-maroon-800">
              Install app
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="cursor-pointer text-slate-400 hover:text-slate-600">
        <X className="size-4" />
      </button>
    </div>
  );
};

export default InstallHint;
