import {
  ShieldCheck,
  Flag,
  BellRing,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";

const features = [
  {
    icon: ShieldCheck,
    title: "Verify information",
    description:
      "Understand whether a claim is supported by available trusted evidence.",
    link: "/verify",
    action: "Check information",
  },
  {
    icon: Flag,
    title: "Report a concern",
    description:
      "Share information about a community concern for appropriate review.",
    link: "/report",
    action: "Submit a report",
  },
  {
    icon: BellRing,
    title: "Verified alerts",
    description:
      "Access important updates that have been reviewed through trusted channels.",
    link: "/alerts",
    action: "View alerts",
  },
  {
    icon: BookOpen,
    title: "Civic information",
    description:
      "Explore trusted civic information explained in clear, accessible language.",
    link: "/civic",
    action: "Explore civic info",
  },
];

function Features() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="One platform"
          title="Built around the questions people actually ask."
          description="Sauti Salama brings verification, reporting, alerts and civic information into one accessible experience."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                hover
                className="group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-white">
                  <Icon size={22} />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>

                <Link
                to={feature.link}
                className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                {feature.action} →
                </Link>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default Features;