import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "../ui";

const links = [
  ["Home", "/"],
  ["Verify", "/verify"],
  ["Report", "/report"],
  ["Alerts", "/alerts"],
  ["Civic Info", "/civic"],
  ["About", "/about"],
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-700 text-white">
            <ShieldCheck size={22} />
          </div>

          <div className="leading-none">
            <p className="text-sm font-bold tracking-wide text-slate-900">
              SAUTI SALAMA
            </p>

            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Trusted Information
            </p>
          </div>
        </NavLink>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-green-700"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Button to="/verify" variant="primary">
            Verify Information
          </Button>
        </div>

        {/* Mobile button */}
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="pt-3">
              <Button
                to="/verify"
                variant="primary"
                className="w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Verify Information
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}