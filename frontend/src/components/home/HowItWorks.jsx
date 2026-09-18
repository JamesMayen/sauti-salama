import {
  SearchCheck,
  FileSearch,
  ShieldCheck,
} from "lucide-react";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";

const steps = [
  {
    number: "01",
    icon: SearchCheck,
    title: "Share the information",
    description:
      "Submit a message, claim or civic question that you want to understand.",
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Check the evidence",
    description:
      "Sauti Salama compares the information with trusted evidence and makes uncertainty visible.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Understand what to do",
    description:
      "Receive a clear explanation and appropriate next steps without unnecessary amplification of harmful claims.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-slate-50 py-20 sm:py-24"
    >
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From information to informed action."
          description="Sauti Salama is designed to make verification understandable, transparent and useful."
          centered
        />

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-emerald-700">
                    {step.number}
                  </span>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="mt-7 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default HowItWorks;