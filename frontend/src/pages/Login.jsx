import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { useAuthContext } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    login,
    loading,
  } = useAuthContext();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * If the user was redirected from a
   * protected page, remember that page.
   */
  const from =
    location.state?.from?.pathname ||
    "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    try {
      const response =
        await login({
          email,
          password,
        });

      const role =
        response?.data?.user?.role;

      /*
       * Dashboard access is intended for
       * authenticated operational users.
       */
      if (
        role === "admin" ||
        role === "moderator" ||
        role === "analyst"
      ) {
        navigate(from, {
          replace: true,
        });

        return;
      }

      setError(
        "Your account does not have dashboard access."
      );
    } catch (error) {
      setError(
        error.message ||
          "Unable to sign in. Please try again."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl lg:grid-cols-2">

        {/* Brand panel */}
        <section className="hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
                <ShieldCheck
                  size={24}
                />
              </div>

              <div>
                <p className="font-semibold">
                  Sauti Salama
                </p>

                <p className="text-xs text-slate-400">
                  Safe Voice
                </p>
              </div>
            </div>

            <h1 className="max-w-md font-serif text-4xl font-semibold leading-tight">
              Trusted information.
              <span className="block text-amber-400">
                Safer communities.
              </span>
            </h1>

            <p className="mt-6 max-w-md leading-7 text-slate-400">
              Access the Sauti Salama
              operational dashboard to review
              reports, verification requests,
              alerts and civic information.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Verify without amplifying.
          </p>
        </section>

        {/* Login form */}
        <section className="p-8 sm:p-12">
          <div className="mx-auto max-w-md">

            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <div>
                  <p className="font-semibold">
                    Sauti Salama
                  </p>

                  <p className="text-xs text-slate-400">
                    Safe Voice
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-amber-400">
                Operational dashboard
              </p>

              <h2 className="text-3xl font-semibold">
                Sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Sign in to manage trusted
                information and community
                reports.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}

                {!loading && (
                  <ArrowRight
                    size={18}
                  />
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <Link
                to="/"
                className="text-sm text-slate-400 transition hover:text-amber-400"
              >
                ← Return to Sauti Salama
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}