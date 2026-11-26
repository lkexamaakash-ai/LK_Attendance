import React from "react";

// Two-panel layout shared by the login, register and set-password pages.
const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
  panelText = "Attendance, students and payroll for every LK Academy branch.",
}) => {
  return (
    <div className="flex min-h-screen w-full bg-app">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-maroon-700 via-maroon-800 to-maroon-900 p-14 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-gold-400/10" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/5" />
        <div className="absolute bottom-24 right-10 size-32 rounded-full border border-gold-400/30" />

        <div className="relative w-fit rounded-2xl bg-white px-7 py-5 shadow-xl">
          <img src="/Header.jpg" alt="LK Academy" className="h-24 w-auto xl:h-28" />
        </div>

        <p className="relative max-w-lg text-2xl leading-relaxed text-maroon-100/90">
          {panelText}
        </p>

        <p className="relative text-sm tracking-wide text-maroon-200/70">
          LK Academy
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-7 shadow-xl sm:p-12">
          <img
            src="/Header.jpg"
            alt="LK Academy"
            className="mx-auto mb-8 h-20 w-auto lg:hidden"
          />
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base text-slate-500 sm:text-lg">{subtitle}</p>
          )}
          <div className="mt-9">{children}</div>
          {footer && (
            <div className="mt-9 border-t border-stone-100 pt-6 text-center text-base text-slate-500">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
