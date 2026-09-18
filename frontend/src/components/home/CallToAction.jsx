import { ArrowRight, ShieldCheck } from "lucide-react";

import { Link } from "react-router-dom";

import Container from "../ui/Container";

function CallToAction() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-emerald-700 px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <ShieldCheck size={18} />
                Information you can act on
              </div>

              <h2 className="mt-4 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Before you forward it, check it.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/90">
                Start with a message, claim or civic question that
                you want to understand.
              </p>
            </div>

            <Link
              to="/verify"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm transition-all hover:bg-emerald-50"
            >
              Verify Information
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CallToAction;