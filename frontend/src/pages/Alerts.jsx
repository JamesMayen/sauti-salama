import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Info,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Container, SectionHeading } from "../components/ui";
import { getAlerts } from "../services/alertService.js";

const filters = ["All", "verified", "unverified", "contested", "emerging_signal"];

const displayStatus = (status) =>
  status
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Unknown";

function StatusBadge({ status }) {
  const styles = {
    Verified: "bg-green-50 text-green-700 border-green-200",
    Unverified: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const icons = {
    Verified: CheckCircle2,
    Unverified: Clock3,
  };

  const Icon = icons[status] || Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <Icon size={14} />
      {status}
    </span>
  );
}

export default function Alerts() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAlerts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getAlerts({ published: "true" });
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "We could not load alerts. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "All") {
      return alerts;
    }

    return alerts.filter((alert) => alert.status === activeFilter);
  }, [activeFilter, alerts]);

  return (
    <main>
      {/* Header */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Community information"
            title="Verified alerts and emerging information."
            description="Access important information with clear source context, timestamps, and verification status. Sauti Salama separates confirmed information from claims that still require further checking."
          />

          {/* Trust notice */}
          <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-green-900">
                  Verification status matters
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-green-800">
                  An alert marked "Unverified" should not be treated as
                  established fact. It means available evidence has not yet
                  reached the threshold required for verification.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Alerts */}
      <section className="bg-white py-16">
        <Container>
          {/* Filters */}
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Latest information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Published alerts with their available source and verification context.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                <Filter size={16} />
                Filter
              </div>

              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === filter
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                  }`}
                >
                  {filter === "All" ? filter : displayStatus(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Alert list */}
          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={loadAlerts}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {isLoading && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading alerts...
            </div>
          )}

          {!isLoading && !error && <div className="mt-8 space-y-5">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert._id}
                className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-6 sm:p-7">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={displayStatus(alert.status)} />

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {displayStatus(alert.category)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-semibold text-slate-900">
                        {alert.title}
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {alert.summary}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-50 p-4 lg:w-52">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Alert level
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {alert.level}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {alert.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock3
                        size={17}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Published</p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {alert.publishedAt || alert.createdAt
                            ? new Date(
                                alert.publishedAt || alert.createdAt
                              ).toLocaleString()
                            : "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ShieldCheck
                        size={17}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Source</p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {alert.source?.name || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <BellRing
                        size={17}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <p className="mt-0.5 font-medium text-slate-700">
                          {displayStatus(alert.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>}

          {/* Empty state */}
          {!isLoading && !error && filteredAlerts.length === 0 && (
            <Card className="mt-8 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <BellRing size={22} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No alerts found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No alerts are currently available for this filter.
              </p>
            </Card>
          )}
        </Container>
      </section>

      {/* Emerging signals */}
      <section className="bg-slate-50 py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle size={22} />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                Emerging signals
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sauti Salama can eventually identify patterns across multiple
                reports by considering factors such as location, category,
                timing, and supporting evidence.
              </p>

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Important distinction
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  An emerging signal indicates that information may deserve
                  further attention. It does not automatically establish that
                  an incident has occurred.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Info size={22} />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                Can't find what you're looking for?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                If you have received information that may be important but
                cannot find it in the alerts section, you can submit it for
                assessment.
              </p>

              <Link
                to="/report"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-green-700 transition hover:text-green-900"
              >
                Report a concern
                <span>→</span>
              </Link>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-white py-8">
        <Container>
          <p className="text-center text-xs leading-5 text-slate-400">
            Alert content is provided with its available publication and
            verification context.
          </p>
        </Container>
      </section>
    </main>
  );
}