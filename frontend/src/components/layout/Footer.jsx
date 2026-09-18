import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowUpRight,
  Mail,
} from "lucide-react";

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <ShieldCheck size={22} />
              </div>

              <span className="font-serif text-xl font-bold text-white">
                SAUTI SALAMA
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              A civic information and community safety platform
              designed to help people verify information, understand
              what is known, and identify safer next steps.
            </p>

            <p className="mt-5 text-sm font-medium text-slate-300">
              Know before you share.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/verify"
                  className="transition-colors hover:text-white"
                >
                  Verify Information
                </Link>
              </li>

              <li>
                <Link
                  to="/report"
                  className="transition-colors hover:text-white"
                >
                  Report an Incident
                </Link>
              </li>

              <li>
                <Link
                  to="/alerts"
                  className="transition-colors hover:text-white"
                >
                  Verified Alerts
                </Link>
              </li>

              <li>
                <Link
                  to="/civic"
                  className="transition-colors hover:text-white"
                >
                  Civic Information
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Learn More
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="transition-colors hover:text-white"
                >
                  About Sauti Salama
                </Link>
              </li>

              <li>
                <Link
                  to="/#how-it-works"
                  className="transition-colors hover:text-white"
                >
                  How It Works
                </Link>
              </li>

              <li>
                <a
                  href="mailto:hello@sautisalama.org"
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail size={14} />
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Sauti Salama. Proof of
            concept.
          </p>

          <p>
            Built for trusted information and safer communities.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;