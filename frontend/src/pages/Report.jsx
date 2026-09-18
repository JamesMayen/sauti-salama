import { useState } from "react";
import {
  MapPin,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Send,
  AlertTriangle,
  LockKeyhole,
} from "lucide-react";
import { Button, Card, Container, SectionHeading } from "../components/ui";
import { createReport } from "../services/reportService.js";

const categories = [
  { value: "security", label: "Safety concern" },
  { value: "misinformation", label: "Misinformation" },
  { value: "violence", label: "Community tension" },
  { value: "service_disruption", label: "Public service issue" },
  { value: "humanitarian", label: "Humanitarian concern" },
  { value: "other", label: "Other" },
];

const urgencyLevels = [
  {
    value: "low",
    label: "Low",
    description: "Important information, but no immediate concern.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Could affect people or a community if confirmed.",
  },
  {
    value: "high",
    label: "High",
    description: "May require timely attention or verification.",
  },
  {
    value: "critical",
    label: "Critical",
    description: "May involve an immediate or serious safety concern.",
  },
];

function getReportErrorMessage(error) {
  if (error.status === 400) {
    return "Please check the information you submitted and try again.";
  }

  if (error.status === 401) {
    return "Please sign in to submit a report.";
  }

  if (error.status === 403) {
    return "You are not authorized to submit this report.";
  }

  if (error.status === 429) {
    return "Too many reports have been submitted from this connection. Please try again later.";
  }

  if (error.status >= 500) {
    return "We couldn't submit your report right now. Please try again later.";
  }

  return error.message || "We could not submit your report. Please try again.";
}

export default function Report() {
  const [form, setForm] = useState({
    description: "",
    location: "",
    date: "",
    time: "",
    category: "",
    urgency: "medium",
    contact: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSubmitted(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      form.description.trim().length < 10 ||
      !form.location.trim() ||
      !form.category
    ) {
      setError(
        "Please provide a description of at least 10 characters, a location, and a category."
      );
      return;
    }

    const contact = form.contact.trim();
    const payload = {
      description: form.description.trim(),
      location: form.location.trim(),
      incidentDate: form.date
        ? `${form.date}${form.time ? `T${form.time}` : ""}`
        : null,
      category: form.category,
      urgency: form.urgency,
      contactName: null,
      contactPhone: contact && !contact.includes("@") ? contact : null,
      contactEmail: contact && contact.includes("@") ? contact : null,
      isAnonymous: !contact,
    };

    setIsSubmitting(true);
    setError("");

    try {
      await createReport(payload);
      setSubmitted(true);
      setForm({
        description: "",
        location: "",
        date: "",
        time: "",
        category: "",
        urgency: "medium",
        contact: "",
      });
    } catch (requestError) {
      setError(getReportErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      {/* Page header */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Community reporting"
            title="Report a concern safely."
            description="Share information about a concern, incident, or emerging situation. Reports are submitted for review and do not automatically become verified incidents or public alerts."
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Form */}
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    What happened?
                  </label>

                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    rows={6}
                    maxLength={3000}
                    placeholder="Describe what you observed or what was reported to you. Stick to information you can describe clearly."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <div className="mt-2 text-right text-xs text-slate-500">
                    {form.description.length}/3000
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <MapPin size={16} />
                    Where did this happen?
                  </label>

                  <input
                    id="location"
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="Example: Juba, Central Equatoria"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Provide only the location necessary to understand the
                    concern. Avoid sharing a person's exact home address.
                  </p>
                </div>

                {/* Date and time */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="date"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <CalendarDays size={16} />
                      Date
                    </label>

                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        updateField("date", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="time"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <Clock3 size={16} />
                      Approximate time
                    </label>

                    <input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(event) =>
                        updateField("time", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    What type of concern is this?
                  </label>

                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Select a category</option>

                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    How urgent is this?
                  </label>

                  <div className="grid gap-3">
                    {urgencyLevels.map((level) => (
                      <label
                        key={level.value}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          form.urgency === level.value
                            ? "border-green-600 bg-green-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="urgency"
                            value={level.value}
                            checked={form.urgency === level.value}
                            onChange={(event) =>
                              updateField("urgency", event.target.value)
                            }
                            className="mt-1"
                          />

                          <div>
                            <span className="text-sm font-semibold text-slate-800">
                              {level.label}
                            </span>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {level.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional contact */}
                <div>
                  <label
                    htmlFor="contact"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Optional contact information
                  </label>

                  <input
                    id="contact"
                    type="text"
                    value={form.contact}
                    onChange={(event) =>
                      updateField("contact", event.target.value)
                    }
                    placeholder="Phone number or email (optional)"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Only provide contact information if you want the team to
                    follow up.
                  </p>
                </div>

                {/* Privacy notice */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <LockKeyhole
                      size={19}
                      className="mt-0.5 shrink-0 text-green-700"
                    />

                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Protect personal information
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Do not include passwords, private medical information,
                        exact home addresses, or unnecessary identifying
                        details about other people.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        Do not put yourself at risk to confirm or investigate
                        an incident. Share only information you can provide
                        safely.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                  aria-busy={isSubmitting}
                  disabled={
                    isSubmitting ||
                    !form.description.trim() ||
                    !form.location.trim() ||
                    !form.category
                  }
                >
                  <Send size={18} />
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                {submitted && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-green-700"
                      />

                      <div>
                        <h3 className="font-semibold text-green-900">
                          Report submitted
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-green-800">
                          Your report has been received and submitted for
                          review. It has not been verified and is not a public
                          alert.
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-green-800">
                          Status: Received
                        </p>
                        <button
                          type="button"
                          onClick={() => setSubmitted(false)}
                          className="mt-3 text-sm font-semibold text-green-800 underline underline-offset-2"
                        >
                          Submit another report
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Card>

            {/* Guidance */}
            <div className="space-y-6">
              <Card className="p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <ShieldCheck size={24} />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-900">
                  Report responsibly
                </h2>

                <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                  <p>
                    Describe what you directly observed separately from what
                    someone else told you.
                  </p>

                  <p>
                    Avoid naming individuals unless there is a clear and
                    legitimate reason to do so.
                  </p>

                  <p>
                    Reports are signals for further assessment. A report alone
                    does not establish that an incident occurred.
                  </p>
                </div>
              </Card>

              <Card className="border-amber-200 bg-amber-50 p-6 sm:p-8">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={21}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <h2 className="font-semibold text-amber-900">
                      Immediate danger
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Sauti Salama is not an emergency response service. If
                      there is an immediate threat to someone's safety, use
                      appropriate local emergency or protection services
                      instead of relying on this form.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}