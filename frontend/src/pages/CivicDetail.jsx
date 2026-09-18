import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, Container } from "../components/ui";
import { getCivicInformationById } from "../services/civicService.js";

const displayCategory = (category) =>
  category
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Other";

const isSafeUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function CivicDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadItem() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getCivicInformationById(id);
        if (mounted) setItem(response.data || null);
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.status === 404
              ? "This civic information is not available."
              : requestError.message ||
                  "We could not load this civic information."
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadItem();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <main>
      <section className="bg-slate-50 py-12 sm:py-16">
        <Container>
          <Link
            to="/civic"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to Civic Information
          </Link>
        </Container>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <Container>
          {isLoading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading civic information...
            </div>
          )}
          {!isLoading && error && (
            <Card className="mx-auto max-w-3xl p-10 text-center">
              <BookOpen className="mx-auto text-slate-400" size={28} aria-hidden="true" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Civic information not found
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
            </Card>
          )}
          {!isLoading && !error && item && (
            <article className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {displayCategory(item.category)}
                </span>
                <span className="text-xs text-slate-500">
                  Last updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Not provided"}
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {item.title}
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">{item.summary}</p>

              <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700">
                {item.content}
              </div>

              <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
                <p>Source: {item.source?.name || "Not provided"}</p>
                {isSafeUrl(item.sourceUrl) && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-green-700 underline"
                  >
                    Open source
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          )}
        </Container>
      </section>
    </main>
  );
}
