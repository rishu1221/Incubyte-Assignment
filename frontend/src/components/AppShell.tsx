import { NavLink, Outlet } from "react-router-dom";
import { cn } from "cn";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/employees", label: "Employees", end: false },
];

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 pt-7 pb-6">
          <p className="text-[11px] tracking-[0.28em] text-sidebar-foreground/60 uppercase">ACME</p>
          <p className="mt-2 text-2xl leading-none font-semibold tracking-normal">Pay ledger</p>
        </div>
        <nav className="grid gap-1 px-3" aria-label="Portal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-5 py-5 text-xs text-sidebar-foreground/55">HR manager</p>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
