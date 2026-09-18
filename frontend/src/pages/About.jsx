import {
  ShieldCheck,
  SearchCheck,
  Smartphone,
  LockKeyhole,
  Users,
  Scale,
  Eye,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Container, SectionHeading } from "../components/ui";

const principles = [
  {
    icon: ShieldCheck,
    title: "Verify without amplifying",
    description:
      "We focus on helping people understand whether information is supported by evidence without unnecessarily repeating or spreading harmful claims.",
  },
  {
    icon: Scale,
    title: "Evidence over assumptions",
    description:
      "Information should be assessed using available evidence, credible sources, timing, and context rather than confidence alone.",
  },
  {
    icon: Eye,
    title: "Make uncertainty visible",
    description:
      "When information cannot be established, the platform should clearly communicate what remains uncertain instead of presenting speculation as fact.",
  },
  {
    icon: Users,
    title: "People at the center",
    description:
      "Sauti Salama is designed around the information needs, safety, accessibility, and dignity of the communities using it.",
  },
];

const accessibilityFeatures = [
  {
    icon: Smartphone,
    title: "Low-bandwidth ready",
    description:
      "The platform is designed to remain useful in environments where connectivity may be limited or inconsistent.",
  },
  {
    icon: MessageCircle,
    title: "Multiple access channels",
    description:
      "The long-term platform vision includes web, SMS, and USSD access so information does not depend entirely on smartphones or continuous internet access.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy conscious",
    description:
      "Users are encouraged to share only the information necessary for verification or reporting and to avoid unnecessary personal details.",
  },
];

export default function About() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,133,91,0.22),transparent_35%)]" />

        <Container className="relative">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-400">
              About Sauti Salama
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Trusted information for safer communities.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Sauti Salama is a civic information and community reporting
              platform designed to help people verify potentially harmful
              information, understand uncertainty, and identify safer next
              steps.
            </p>
          </div>
        </Container>
      </section>

      {/* What is Sauti Salama */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Our purpose"
                title="Information is most useful when people can trust and understand it."
                description="Sauti Salama brings verification, community reporting, alerts, and civic information together in one accessible experience."
              />

              <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
                <p>
                  People regularly encounter messages and claims whose origin,
                  accuracy, or context may not be immediately clear. When
                  information concerns safety, public services, or community
                  relationships, understanding what is known and what remains
                  uncertain can matter.
                </p>

                <p>
                  Sauti Salama is designed to provide a structured way to
                  examine information rather than simply asking people to
                  accept or reject a claim.
                </p>

                <p>
                  The platform combines technology with responsible information
                  practices: source awareness, evidence, timestamps, context,
                  uncertainty, and appropriate next steps.
                </p>
              </div>
            </div>

            <Card className="relative overflow-hidden bg-slate-900 p-8 sm:p-10">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-green-700/20 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-green-400">
                  <SearchCheck size={28} />
                </div>

                <h2 className="mt-7 text-2xl font-semibold text-white">
                  Our central principle
                </h2>

                <p className="mt-4 text-3xl font-semibold leading-tight text-white">
                  Verify without amplifying.
                </p>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  The goal is not simply to label information. It is to give
                  people enough evidence and context to make safer,
                  better-informed decisions about what they read and share.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Challenge */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="The challenge"
            title="Information can move faster than verification."
            description="Sauti Salama is designed around several practical challenges that affect how people receive and act on information."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <MessageCircle size={24} />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900">
                Rapid information sharing
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Messages can be forwarded quickly, sometimes before their
                source, date, or context has been established.
              </p>
            </Card>

            <Card className="p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <SearchCheck size={24} />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900">
                Context is important
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                A statement can be misleading when it is separated from the
                original source, date, location, or circumstances.
              </p>
            </Card>

            <Card className="p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Smartphone size={24} />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-900">
                Access is not equal
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                A useful information service should consider people using
                different devices and operating under different connectivity
                conditions.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Responsible AI */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Responsible AI"
                title="AI should support verification, not replace judgment."
                description="Sauti Salama is designed to use AI as an assistance layer while keeping evidence, sources, and uncertainty visible."
              />

              <div className="mt-8 space-y-4">
                {[
                  "AI-generated assessments should be grounded in available evidence.",
                  "Sources should be identified where possible.",
                  "The system should distinguish verified information from uncertainty.",
                  "AI should not invent sources, incidents, quotations, or evidence.",
                  "High risk does not automatically mean information is false.",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-1 shrink-0 text-green-700"
                    />

                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-slate-200 bg-slate-50 p-8 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verification model
              </p>

              <div className="mt-7 space-y-4">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400">
                    STEP 01
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    Understand the claim
                  </p>
                </div>

                <div className="flex justify-center text-slate-300">
                  ↓
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400">
                    STEP 02
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    Examine available evidence
                  </p>
                </div>

                <div className="flex justify-center text-slate-300">
                  ↓
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400">
                    STEP 03
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    Communicate evidence and uncertainty
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Accessibility */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Designed for access"
            title="Useful information should not depend on perfect connectivity."
            description="The platform is being designed with different devices, connectivity conditions, and user needs in mind."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {accessibilityFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Principles */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Our principles"
            title="Built around trust, context, and responsibility."
            description="These principles guide how Sauti Salama should handle information as the platform develops."
            centered
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {principles.map((principle) => {
              const Icon = principle.icon;

              return (
                <Card key={principle.title} className="p-7 sm:p-8">
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <Icon size={23} />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {principle.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-400">
                Start with verification
              </p>

              <h2 className="mt-3 text-3xl font-semibold text-white">
                Before you forward it, check it.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use Sauti Salama to examine information and understand what is
                known before sharing it with others.
              </p>
            </div>

            <Link
              to="/verify"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Verify information
              <ArrowRight size={17} />
            </Link>
          </div>
        </Container>
      </section>

      {/* Prototype notice */}
      <section className="bg-white py-7">
        <Container>
          <p className="text-center text-xs leading-5 text-slate-400">
            Sauti Salama is a civic-tech prototype. Platform capabilities and
            information sources will expand as development progresses.
          </p>
        </Container>
      </section>
    </main>
  );
}