import {
  MessageCircleWarning,
  HelpCircle,
  Radio,
} from "lucide-react";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";

const problems = [
  {
    icon: MessageCircleWarning,
    title: "Rumors spread quickly",
    description:
      "Unverified claims can move through messaging apps, social media, radio and word of mouth faster than they can be checked.",
  },
  {
    icon: HelpCircle,
    title: "People need context",
    description:
      "Finding information is only the beginning. People also need to understand what is confirmed, what is uncertain and what it means.",
  },
  {
    icon: Radio,
    title: "Connectivity is uneven",
    description:
      "Essential civic information should not depend entirely on having a reliable internet connection or a modern smartphone.",
  },
];

function ProblemSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="The information gap"
          title="Information should help people make informed decisions."
          description="In communities where information can move quickly and connectivity can be limited, knowing what to trust matters."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {problems.map((problem) => {
            const Icon = problem.icon;

            return (
              <div
                key={problem.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={22} />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  {problem.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default ProblemSection;