import {
  Smartphone,
  MessageSquare,
  WifiOff,
  ArrowRight,
} from "lucide-react";

import Container from "../ui/Container";

function LowBandwidth() {
  return (
    <section className="overflow-hidden bg-slate-950 py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Designed for real-world access
            </p>

            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Civic information shouldn't depend on a perfect internet connection.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              Sauti Salama is being designed with low-bandwidth environments
              in mind, including future access through USSD and SMS.
            </p>

            <a
              href="/about"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Learn about our approach
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Smartphone size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    Web
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Full experience for smartphones and computers.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageSquare size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    SMS / USSD
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Essential information through basic mobile access.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <WifiOff size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    Low bandwidth
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Designed to minimize unnecessary data requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default LowBandwidth;