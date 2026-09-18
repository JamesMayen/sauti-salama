import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSearch,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Card } from "../ui";

const truthStatusDescriptions = {
  verified:
    "Available supplied evidence sufficiently supports the material claim.",
  partially_verified:
    "Some material elements are supported, but the complete claim is not established.",
  unverified:
    "Available evidence is insufficient to establish the claim.",
  contested:
    "Credible supplied evidence conflicts regarding the claim.",
  false:
    "Reliable supplied evidence directly contradicts the claim.",
};

const truthStatusStyles = {
  verified: "border-green-200 bg-green-50 text-green-800",
  partially_verified: "border-sky-200 bg-sky-50 text-sky-800",
  unverified: "border-amber-200 bg-amber-50 text-amber-800",
  contested: "border-orange-200 bg-orange-50 text-orange-800",
  false: "border-red-200 bg-red-50 text-red-800",
};

const riskStyles = {
  low: "border-green-200 bg-green-50 text-green-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

const formatLabel = (value) =>
  value
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Not available";

function isSafeExternalUrl(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ConfidenceValue({ confidence }) {
  if (confidence === null || confidence === undefined) {
    return <p className="mt-1 text-sm text-slate-500">Not available</p>;
  }

  const percentage = Math.round(confidence * 100);

  return (
    <p className="mt-1 text-lg font-semibold text-slate-900">
      {percentage}%
    </p>
  );
}

function EvidenceSection({ evidence }) {
  if (!evidence?.length) {
    return (
      <section aria-labelledby="evidence-heading" className="border-t border-slate-200 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <FileSearch className="mt-0.5 shrink-0 text-slate-400" size={20} aria-hidden="true" />
          <div>
            <h3 id="evidence-heading" className="font-semibold text-slate-900">
              Evidence
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No supporting evidence was available for this assessment. This
              does not establish that the claim is false.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="evidence-heading" className="border-t border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <FileSearch className="text-slate-500" size={20} aria-hidden="true" />
        <h3 id="evidence-heading" className="font-semibold text-slate-900">
          Evidence available
        </h3>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {evidence.map((item, index) => (
          <article key={item.evidenceId || `${item.source}-${index}`} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-800">
                {item.title || item.source || "Supplied source"}
              </h4>
              {item.evidenceId && (
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {item.evidenceId}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {item.sourceType ? formatLabel(item.sourceType) : "Source type not available"}
              {item.date ? ` | ${item.date}` : ""}
            </p>

            {item.relevance && (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.relevance}
              </p>
            )}

            {isSafeExternalUrl(item.url) && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-green-700 underline underline-offset-2"
              >
                Open source
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function VerificationResult({ claim, result }) {
  const truthStatus = result?.truthStatus;
  const riskLevel = result?.riskLevel;
  const uncertainties = Array.isArray(result?.uncertainties)
    ? result.uncertainties
    : [];
  const actions = result?.recommendedAction
    ? [result.recommendedAction]
    : [];

  return (
    <section className="bg-white py-16" aria-labelledby="verification-result-heading">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification assessment
            </p>
            <h2 id="verification-result-heading" className="mt-2 text-2xl font-semibold text-slate-900">
              Assessment of the available information
            </h2>

            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Claim submitted
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{claim}</p>
            </div>
          </div>

          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-700" size={20} aria-hidden="true" />
              <h3 className="font-semibold text-slate-900">Assessment overview</h3>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-xl border p-4 ${truthStatusStyles[truthStatus] || "border-slate-200 bg-slate-50 text-slate-800"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">Truth status</p>
                <p className="mt-2 text-lg font-semibold">{formatLabel(truthStatus)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${riskStyles[riskLevel] || "border-slate-200 bg-slate-50 text-slate-800"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">Risk level</p>
                <p className="mt-2 text-lg font-semibold">{formatLabel(riskLevel)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment confidence</p>
                <ConfidenceValue confidence={result?.confidence} />
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Risk level reflects the potential harm of acting on or spreading
              information. It is separate from whether the claim is verified.
            </p>

            {truthStatus && truthStatusDescriptions[truthStatus] && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {truthStatusDescriptions[truthStatus]}
              </p>
            )}
          </div>

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2">
            <section aria-labelledby="summary-heading">
              <h3 id="summary-heading" className="font-semibold text-slate-900">Summary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {result?.summary || "No summary is available for this assessment."}
              </p>
            </section>

            <section aria-labelledby="explanation-heading">
              <h3 id="explanation-heading" className="font-semibold text-slate-900">Explanation</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {result?.reasoning || "No explanation is available for this assessment."}
              </p>
            </section>
          </div>

          <EvidenceSection evidence={result?.evidence} />

          <div className="grid gap-6 border-t border-slate-200 p-6 sm:p-8 md:grid-cols-2">
            <section aria-labelledby="uncertainties-heading">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={19} aria-hidden="true" />
                <h3 id="uncertainties-heading" className="font-semibold text-slate-900">What remains uncertain</h3>
              </div>
              {uncertainties.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {uncertainties.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  No additional uncertainties were identified in the available information.
                </p>
              )}
            </section>

            <section aria-labelledby="actions-heading">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={19} aria-hidden="true" />
                <h3 id="actions-heading" className="font-semibold text-slate-900">Recommended next steps</h3>
              </div>
              {actions.length ? (
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {actions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ol>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  No additional next steps were provided for this assessment.
                </p>
              )}
            </section>
          </div>

          {truthStatus === "unverified" && (
            <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-900 sm:px-8">
              The available information was not sufficient to establish this claim. Unverified does not mean false.
            </div>
          )}

          <div className="flex items-start gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-500 sm:px-8">
            <Info className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
            <p>Assessment results depend on the available information and may remain uncertain.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
