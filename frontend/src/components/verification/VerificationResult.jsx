import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSearch,
  Info,
  ShieldCheck,
  Search,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Card } from "../ui";

const truthStatusDescriptions = {
  verified: "Available evidence sufficiently supports the material claim.",
  partially_verified: "Some material elements are supported, but the complete claim is not established.",
  unverified: "Available evidence is insufficient to establish the claim.",
  contested: "Credible evidence conflicts regarding the claim.",
  false: "Reliable evidence directly contradicts the claim.",
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

const sufficiencyStyles = {
  sufficient: "border-green-200 bg-green-50 text-green-800",
  conflicting: "border-orange-200 bg-orange-50 text-orange-800",
  insufficient: "border-amber-200 bg-amber-50 text-amber-800",
  technical_failure: "border-red-200 bg-red-50 text-red-800",
};

const formatLabel = (value) =>
  value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";

const tierLabels = {
  1: "Tier 1 — Primary/Authoritative",
  2: "Tier 2 — Recognized Institutional",
  3: "Tier 3 — Recognized Independent",
  4: "Tier 4 — Community/Other",
};

const tierColors = {
  1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  2: "bg-blue-100 text-blue-800 border-blue-200",
  3: "bg-purple-100 text-purple-800 border-purple-200",
  4: "bg-slate-100 text-slate-600 border-slate-200",
};

function isSafeExternalUrl(value) {
  if (!value || typeof value !== "string") return false;
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
  return <p className="mt-1 text-lg font-semibold text-slate-900">{percentage}%</p>;
}

function EvidenceCard({ item, index }) {
  const tier = item.sourceTier || 4;
  const relationship = item.relationshipToClaim || "inconclusive";

  const relationshipLabels = {
    direct_support: "Directly supports claim",
    partial_support: "Partially supports claim",
    contextual: "Contextual information",
    contradicts: "Contradicts claim",
    irrelevant: "Irrelevant",
    inconclusive: "Relationship unclear",
  };

  const relationshipColors = {
    direct_support: "text-green-700 bg-green-50",
    partial_support: "text-blue-700 bg-blue-50",
    contextual: "text-purple-700 bg-purple-50",
    contradicts: "text-red-700 bg-red-50",
    irrelevant: "text-slate-600 bg-slate-100",
    inconclusive: "text-amber-700 bg-amber-50",
  };

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-800">
          {item.title || item.source || "Source"}
        </h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${tierColors[tier] || "border-slate-200 bg-slate-100 text-slate-600"}`}>
          {tierLabels[tier] || `Tier ${tier}`}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${relationshipColors[relationship] || "bg-slate-100 text-slate-600"}`}>
          {relationshipLabels[relationship] || relationship}
        </span>
        {item.publisher && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {item.publisher}
          </span>
        )}
        {item.evidenceScore !== null && item.evidenceScore !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            <BarChart3 size={10} />
            Score: {Math.round(item.evidenceScore * 100)}%
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {item.sourceType ? formatLabel(item.sourceType) : "Source type not available"}
        {item.date ? ` | ${item.date}` : ""}
        {item.retrievedAt ? ` | Checked ${new Date(item.retrievedAt).toLocaleDateString()}` : ""}
      </div>

      {item.snippet && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.snippet}</p>
      )}

      {item.relevance && (
        <p className="mt-2 text-xs text-slate-500">{item.relevance}</p>
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
  );
}

function EvidenceSection({ evidence, noEvidenceFound }) {
  if (noEvidenceFound) {
    return (
      <section aria-labelledby="evidence-heading" className="border-t border-slate-200 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <FileSearch className="mt-0.5 shrink-0 text-amber-500" size={20} aria-hidden="true" />
          <div>
            <h3 id="evidence-heading" className="font-semibold text-slate-900">Evidence search</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Insufficient credible evidence found. This claim has been sent for human review.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Online research was conducted but no authoritative sources could be found to verify or contradict this claim.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!evidence?.length) {
    return (
      <section aria-labelledby="evidence-heading" className="border-t border-slate-200 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <FileSearch className="mt-0.5 shrink-0 text-slate-400" size={20} aria-hidden="true" />
          <div>
            <h3 id="evidence-heading" className="font-semibold text-slate-900">Evidence</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No supporting evidence was available for this assessment. This does not establish that the claim is false.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="evidence-heading" className="border-t border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Search className="text-slate-500" size={20} aria-hidden="true" />
        <h3 id="evidence-heading" className="font-semibold text-slate-900">Evidence retrieved</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {evidence.length} source{evidence.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {evidence.map((item, index) => (
          <EvidenceCard key={item.evidenceId || `${item.source}-${index}`} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function VerificationResult({ claim, result }) {
  const truthStatus = result?.truthStatus;
  const riskLevel = result?.riskLevel;
  const evidenceSufficiency = result?.evidenceSufficiency;
  const reviewReason = result?.reviewReason;
  const uncertainties = Array.isArray(result?.uncertainties) ? result.uncertainties : [];
  const actions = result?.recommendedAction ? [result.recommendedAction] : [];
  const technicalFailure = result?.technicalFailure || false;
  const claimType = result?.claimType || null;
  const retrievalMethod = result?.retrievalMethod || null;
  const noEvidenceFound = reviewReason === "no_evidence_found";

  if (technicalFailure) {
    return (
      <section className="bg-white py-16" aria-labelledby="verification-result-heading">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Card className="overflow-hidden border-red-200">
            <div className="border-b border-red-100 bg-red-50 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 shrink-0 text-red-600" size={24} aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">Technical issue</p>
                  <h2 id="verification-result-heading" className="mt-2 text-2xl font-semibold text-red-900">
                    Verification temporarily unavailable
                  </h2>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white/50 p-5">
                <p className="text-sm leading-6 text-red-800">
                  The evidence retrieval system could not be reached at this time. This does not mean the claim is true or false.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm text-slate-600">
                Please try again later. If the issue persists, contact the system administrator.
              </p>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16" aria-labelledby="verification-result-heading">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification assessment</p>
            <h2 id="verification-result-heading" className="mt-2 text-2xl font-semibold text-slate-900">
              Assessment of the available information
            </h2>

            <div className="mt-6 rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claim submitted</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{claim}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {claimType && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Type: {formatLabel(claimType)}
                </span>
              )}
              {retrievalMethod && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Evidence: {retrievalMethod === "online_search" ? "Online search" : retrievalMethod === "mixed" ? "Online + registry" : "Source registry"}
                </span>
              )}
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
              <div className={`rounded-xl border p-4 ${sufficiencyStyles[evidenceSufficiency] || "border-slate-200 bg-slate-50 text-slate-800"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">Evidence sufficiency</p>
                <p className="mt-2 text-lg font-semibold">{formatLabel(evidenceSufficiency)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment confidence</p>
                <ConfidenceValue confidence={result?.confidence} />
              </div>
              {result?.retrievedAt && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence retrieved</p>
                  <p className="mt-1 text-sm text-slate-700">{new Date(result.retrievedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Risk level reflects the potential harm of acting on or spreading information. It is separate from whether the claim is verified.
            </p>

            {truthStatus && truthStatusDescriptions[truthStatus] && (
              <p className="mt-2 text-sm leading-6 text-slate-600">{truthStatusDescriptions[truthStatus]}</p>
            )}
          </div>

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-2">
            <section aria-labelledby="summary-heading">
              <h3 id="summary-heading" className="font-semibold text-slate-900">Summary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{result?.summary || "No summary is available for this assessment."}</p>
            </section>

            <section aria-labelledby="explanation-heading">
              <h3 id="explanation-heading" className="font-semibold text-slate-900">Explanation</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{result?.reasoning || "No explanation is available for this assessment."}</p>
            </section>
          </div>

          <EvidenceSection evidence={result?.evidence} noEvidenceFound={noEvidenceFound} />

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
                <p className="mt-3 text-sm leading-6 text-slate-600">No additional uncertainties were identified in the available information.</p>
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
                <p className="mt-3 text-sm leading-6 text-slate-600">No additional next steps were provided for this assessment.</p>
              )}
            </section>
          </div>

          {noEvidenceFound && (
            <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-900 sm:px-8">
              <p className="font-semibold">Insufficient credible evidence found. This claim has been sent for human review.</p>
              <p className="mt-1">Online research did not find authoritative sources to verify or contradict this claim. This does not mean the claim is false.</p>
            </div>
          )}

          {truthStatus === "unverified" && !noEvidenceFound && !technicalFailure && (
            <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-900 sm:px-8">
              The available information was not sufficient to establish this claim. Unverified does not mean false.
            </div>
          )}

          {truthStatus === "verified" && !technicalFailure && (
            <div className="border-t border-green-200 bg-green-50 px-6 py-4 text-sm leading-6 text-green-900 sm:px-8">
              Verified based on authoritative sources.
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
