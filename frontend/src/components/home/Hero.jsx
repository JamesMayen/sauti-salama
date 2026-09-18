import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { Link } from "react-router-dom";

import Container from "../ui/Container";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-700/20 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-20 lg:grid-cols-2 lg:py-24">
          {/* Left content */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Trusted civic information
            </div>

            {/* Heading */}
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Know before
              <span className="block text-emerald-400">
                you share.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              Sauti Salama helps communities verify potentially
              harmful information, understand what is known, and
              identify safer next steps.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/verify"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition-all hover:bg-emerald-500 hover:shadow-xl"
              >
                <ShieldCheck size={18} />
                Verify Information
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
              >
                Report an Incident
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-emerald-400"
                />
                Evidence-based
              </div>

              <div className="flex items-center gap-2">
                <Smartphone
                  size={16}
                  className="text-emerald-400"
                />
                Low-bandwidth ready
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className="text-emerald-400"
                />
                Privacy conscious
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-md">
              {/* Main card */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Information check
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      Sauti Salama
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck size={19} />
                  </div>
                </div>

                {/* Fake claim */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    CLAIM
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    “An important community announcement is
                    circulating online.”
                  </p>
                </div>

                {/* Result */}
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Unverified
                    </span>

                    <span className="text-xs text-slate-500">
                      Requires review
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    The available evidence does not currently
                    confirm this claim.
                  </p>
                </div>

                {/* Action */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <ArrowRight size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Recommended next step
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Check trusted sources before sharing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative card */}
              <div className="absolute -bottom-8 -left-16 hidden w-56 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur lg:block">
                <p className="text-xs text-slate-500">
                  TRUSTED SOURCES
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-sm text-slate-300">
                    Evidence checked
                  </span>
                </div>
              </div>

              {/* Decorative status */}
              <div className="absolute -right-10 -top-6 hidden rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur lg:block">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-xs font-semibold text-white">
                    Source verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;