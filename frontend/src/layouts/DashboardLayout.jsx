import { useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  FileWarning,
  Bell,
  BookOpen,
  Database,
  MessageSquare,
  Users,
  Menu,
  X,
  LogOut,
  UserCircle,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";

const navigation = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "moderator", "analyst"],
  },
  {
    label: "Verification",
    path: "/dashboard/verification",
    icon: ShieldCheck,
    roles: ["admin", "moderator", "analyst"],
  },
  {
    label: "Reports",
    path: "/dashboard/reports",
    icon: FileWarning,
    roles: ["admin", "moderator", "analyst"],
  },
  {
    label: "Alerts",
    path: "/dashboard/alerts",
    icon: Bell,
    roles: ["admin", "moderator", "analyst"],
  },
  {
    label: "Civic Information",
    path: "/dashboard/civic",
    icon: BookOpen,
    roles: ["admin", "moderator", "analyst"],
  },
  {
    label: "Sources",
    path: "/dashboard/sources",
    icon: Database,
    roles: ["admin", "moderator"],
  },
  {
    label: "Users",
    path: "/dashboard/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "SMS",
    path: "/dashboard/sms",
    icon: MessageSquare,
    roles: ["admin", "moderator"],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || "analyst";

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(role)
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 backdrop-blur lg:hidden">
        <div>
          <p className="text-lg font-bold tracking-tight">
            Sauti Salama
          </p>

          <p className="text-xs text-slate-400">
            Safe Voice Dashboard
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          aria-label="Toggle dashboard menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Brand */}
            <div className="border-b border-white/10 px-6 py-6">
              <p className="text-xl font-bold">
                Sauti Salama
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Trusted information. Safer communities.
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-amber-400/10 text-amber-300"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <UserCircle
                  size={38}
                  className="shrink-0 text-slate-400"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user?.fullName || "User"}
                  </p>

                  <p className="truncate text-xs capitalize text-slate-400">
                    {role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close dashboard menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}