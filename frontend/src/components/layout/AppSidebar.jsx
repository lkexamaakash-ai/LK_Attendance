"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";

// Shared sidebar for every role. Each role passes its own menu items.
const AppSidebar = ({ items, open, setOpen, roleLabel }) => {
  const pathname = usePathname();
  const router = useRouter();
  const rootLink = items[0]?.link;

  const close = () => setOpen?.(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const isActive = (link) =>
    pathname === link || (link !== rootLink && pathname.startsWith(`${link}/`));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 xl:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 flex-col bg-gradient-to-b from-maroon-800 to-maroon-900 text-white shadow-2xl transition-transform duration-200 xl:static xl:z-auto xl:w-[15vw] xl:min-w-[236px] xl:shrink-0 xl:translate-x-0 xl:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-4 pb-3 pt-5">
          <div className="rounded-xl bg-white px-3 py-2 shadow-md">
            <Image
              alt="LK Academy"
              src="/Header.jpg"
              width={200}
              height={60}
              priority
              className="h-11 w-auto object-contain"
            />
          </div>
          <button
            onClick={close}
            aria-label="Close menu"
            className="rounded-lg p-2 text-maroon-100 hover:bg-white/10 xl:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {roleLabel && (
          <p className="px-6 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300/90">
            {roleLabel}
          </p>
        )}

        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <ul className="space-y-1">
            {items.map(({ name, link, icon: Icon }) => {
              const active = isActive(link);
              return (
                <li key={link}>
                  <Link
                    href={link}
                    onClick={close}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-maroon-100/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gold-400" />
                    )}
                    {Icon && (
                      <Icon
                        className={`size-[18px] shrink-0 ${
                          active
                            ? "text-gold-300"
                            : "text-maroon-200 group-hover:text-gold-300"
                        }`}
                      />
                    )}
                    <span className="truncate">{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold-400 px-3 py-2.5 text-sm font-semibold text-maroon-900 transition-colors hover:bg-gold-300"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
