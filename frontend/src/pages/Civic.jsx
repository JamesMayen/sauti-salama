import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  ShieldCheck,
  Users,
  FileText,
  Megaphone,
  HeartHandshake,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Container, SectionHeading } from "../components/ui";
import { getCivicInformation } from "../services/civicService.js";

const categories = [
  "All",
  "rights",
  "services",
  "safety",
  "reporting",
  "governance",
  "elections",
  "documentation",
  "other",
];

const categoryIcons = {
  rights: Users,
  services: FileText,
  safety: ShieldCheck,
  reporting: Megaphone,
  governance: HeartHandshake,
  elections: Users,
  documentation: FileText,
  other: BookOpen,
};

const displayCategory = (category) =>
  category
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Other";

export default function Civic() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCivicInformation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCivicInformation({ published: "true" });
      setTopics(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "We could not load civic information. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCivicInformation();
  }, []);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();

    return topics.filter((topic) => {
      const summary = topic.summary || "";
      const matchesCategory =
        category === "All" || topic.category === category;
      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query) ||
        topic.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category, topics]);

  return (
    <main>
      <section className="bg-slate-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Civic information"
            title="Understand. Participate. Stay informed."
            description="Find practical information about civic participation, community dialogue, digital safety, and accessing trustworthy public information."
          />

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search civic information..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16">
        <Container>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  category === item
                    ? "border-green-700 bg-green-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                }`}
              >
                {item === "All" ? item : displayCategory(item)}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Civic resources
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredTopics.length} {filteredTopics.length === 1 ? "resource" : "resources"} available
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock3 size={14} />
              Information should always be checked for freshness.
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={loadCivicInformation}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Loading civic information...
            </div>
          ) : !error && filteredTopics.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTopics.map((topic) => {
                const Icon = categoryIcons[topic.category] || BookOpen;

                return (
                  <Card
                    key={topic._id}
                    className="group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
                        <Icon size={23} />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {displayCategory(topic.category)}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-slate-900">
                      {topic.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {topic.summary}
                    </p>
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Last verified</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {topic.lastVerifiedAt || topic.updatedAt
                              ? new Date(topic.lastVerifiedAt || topic.updatedAt).toLocaleDateString()
                              : "Not provided"}
                          </p>
                          {topic.source?.name && (
                            <p className="mt-1 text-xs text-slate-500">
                              Source: {topic.source.name}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/civic/${topic._id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-green-200 group-hover:text-green-700"
                          aria-label={`Open ${topic.title}`}
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : !error ? (
            <Card className="mt-8 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <BookOpen size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">
                No resources found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No civic information is currently available for this filter.
              </p>
            </Card>
          ) : null}
        </Container>
      </section>

      <section className="bg-slate-50 py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <ShieldCheck size={22} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                Information with context
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Civic information should be presented with its source,
                publication or verification date, and relevant context. This
                helps people make informed decisions without relying on
                incomplete information.
              </p>
            </Card>
            <Card className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock3 size={22} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                Information can change
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Laws, public services, procedures, and announcements can
                change over time. Always check the date and source of important
                information before acting on it.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-white py-14">
        <Container>
          <div className="rounded-2xl bg-slate-900 p-8 text-center sm:p-10">
            <BookOpen className="mx-auto text-green-400" size={30} />
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Can't find the information you need?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              If you have received information that you are unsure about, use
              Sauti Salama's verification feature before sharing it.
            </p>
            <Link
              to="/verify"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Verify information
              <ChevronRight size={17} />
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-white pb-8">
        <Container>
          <p className="text-center text-xs leading-5 text-slate-400">
            Check the publication date and source before acting on civic
            information.
          </p>
        </Container>
      </section>
    </main>
  );
}
