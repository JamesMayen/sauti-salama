import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { getReviewQueue, resolveReview } from "../../services/reviewService.js";

const truthStatusOptions = [
  "verified",
  "partially_verified",
  "unverified",
  "contested",
  "false",
];

const statusLabel = (value) =>
  value
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Not available";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "Not available");

export default function ReviewQueue() {
  const { user } = useAuthContext();
  const canReview = ["admin", "moderator"].includes(user?.role);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [decision, setDecision] = useState("unverified");
  const [notes, setNotes] = useState("");

  const loadQueue = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getReviewQueue();
      setItems(Array.isArray(response.data) ? response.data : []);
      if (response.data?.[0]?._id) {
        setSelectedId(response.data[0]._id);
      }
    } catch (requestError) {
      setError(requestError.message || "We could not load the review queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canReview) {
      loadQueue();
    }
  }, [canReview]);

  const selectedItem = items.find((item) => item._id === selectedId) || null;

  const handleDecision = async (event) => {
    event.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        truthStatus: decision,
        riskLevel: "medium",
        summary: `Human review determined the claim is ${statusLabel(decision).toLowerCase()}.`,
        reasoning: notes || "Reviewed by a human reviewer after insufficient reliable evidence was initially identified.",
        evidence: selectedItem?.result?.evidence || [],
        uncertainties: [
          selectedItem?.reviewReason === "insufficient_evidence"
            ? "The available evidence was insufficient to establish the claim independently."
            : "Additional evidence was reviewed by a human analyst.",
        ],
        recommendedAction: "Use the final human-reviewed status as the operating conclusion and avoid forwarding the claim as established fact until evidence is confirmed.",
        notes,
      };

      await resolveReview(selectedItem._id, payload);
      setSuccess("Review outcome saved successfully.");
      await loadQueue();
    } catch (requestError) {
      setError(requestError.message || "We could not save the review decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canReview) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-semibold text-white">Access restricted</h1>
        <p className="mt-3 text-sm text-slate-300">Only authorized reviewers can access the human review queue.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Verification Review</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Human review queue</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Claims that could not be confirmed by reliable evidence are routed here for a human decision.</p>
        </div>
        <button type="button" onClick={loadQueue} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-60">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-700 bg-red-950/60 p-4 text-sm text-red-200">{error}</div>}
      {success && <div className="mb-6 rounded-xl border border-emerald-700 bg-emerald-950/60 p-4 text-sm text-emerald-200">{success}</div>}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">Loading review queue...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-300">No claims currently require human review.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert size={18} /> Needs Human Review
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${selectedId === item._id ? "border-amber-500 bg-slate-800" : "border-slate-700 bg-slate-950 hover:border-slate-500"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{statusLabel(item.reviewReason || item.status)}</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">Needs Review</span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-300">{item.claim}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Clock3 size={12} /> {formatDate(item.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedItem && (
            <form onSubmit={handleDecision} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Claim</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{selectedItem.claim}</h2>
                </div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200">Insufficient Reliable Evidence</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Review reason</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedItem.reviewReason ? statusLabel(selectedItem.reviewReason) : "Manual review"}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Priority</p>
                  <p className="mt-2 text-sm text-slate-200">{statusLabel(selectedItem.priority)}</p>
                </div>
                {selectedItem.claimType && (
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Claim type</p>
                    <p className="mt-2 text-sm text-slate-200">{statusLabel(selectedItem.claimType)}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Evidence status</p>
                <p className="mt-2 text-sm text-slate-200">
                  {selectedItem.result?.evidence?.length > 0
                    ? `Evidence was retrieved (${selectedItem.result.evidence.length} source${selectedItem.result.evidence.length !== 1 ? "s" : ""}). The system could not find enough reliable evidence to establish or contradict this claim.`
                    : "The AI could not find enough reliable evidence to establish or contradict this claim. This item remains unverified until a human reviewer decides otherwise."}
                </p>
              </div>

              {selectedItem.result?.evidence?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-slate-200">Retrieved evidence</p>
                  {selectedItem.result.evidence.map((item, index) => (
                    <div key={item.evidenceId || index} className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">{item.title || item.source || "Source"}</p>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">Tier {item.sourceTier || "?"}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{item.sourceType || "Source type unavailable"}{item.date ? ` | ${item.date}` : ""}{item.publisher ? ` | ${item.publisher}` : ""}</p>
                      {item.relationshipToClaim && <p className="mt-1 text-xs text-slate-400">Relationship: {item.relationshipToClaim.replace(/_/g, " ")}</p>}
                      {item.relevance && <p className="mt-2 text-xs text-slate-300">{item.relevance}</p>}
                      {item.url && /^https?:\/\//i.test(item.url) && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-emerald-300 underline">Open source</a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-slate-200">
                  Human review decision
                  <select value={decision} onChange={(event) => setDecision(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                    {truthStatusOptions.map((option) => (
                      <option key={option} value={option}>{statusLabel(option)}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  Review notes
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Add notes about the evidence reviewed by the human reviewer." />
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                  <CheckCircle2 size={16} /> {isSubmitting ? "Saving..." : "Save review decision"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
