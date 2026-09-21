import { useEffect, useMemo, useState } from "react";
import { Clock3, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { getVerification, getVerifications } from "../../services/verificationService.js";

const statuses = ["all", "pending", "processing", "completed", "failed", "needs_review"];
const priorities = ["all", "low", "normal", "high", "urgent"];

const label = (value) =>
  value
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Not available";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "Not available";

function StateMessage({ children, error = false }) {
  return (
    <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-700 bg-red-950/60 text-red-100" : "border-slate-700 bg-slate-900 text-slate-300"}`}>
      {children}
    </div>
  );
}

export default function Verification() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  const loadRecords = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters = {};
      if (status !== "all") filters.status = status;
      if (priority !== "all") filters.priority = priority;
      const response = await getVerifications(filters);
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || "We could not load verification records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [status, priority]);

  const openDetails = async (id) => {
    setIsDetailLoading(true);
    setDetailError("");
    try {
      const response = await getVerification(id);
      setSelected(response.data || null);
    } catch (requestError) {
      setDetailError(requestError.message || "We could not load this verification record.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredRecords = useMemo(() => records, [records]);

  return (
    <div className="mx-auto max-w-7xl text-white">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Verification</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review submitted verification requests and any result recorded by the backend.</p>
        </div>
        <button type="button" onClick={loadRecords} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-60">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : label(item)}</option>)}
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {priorities.map((item) => <option key={item} value={item}>{item === "all" ? "All priorities" : label(item)}</option>)}
        </select>
      </div>

      {error && <StateMessage error>{error} <button type="button" onClick={loadRecords} className="ml-2 font-semibold underline">Try again</button></StateMessage>}
      {isLoading && !error && <StateMessage>Loading verification records...</StateMessage>}
      {!isLoading && !error && filteredRecords.length === 0 && <StateMessage>No verification records found.</StateMessage>}

      {!isLoading && !error && filteredRecords.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr_auto] gap-4 border-b border-slate-700 bg-slate-950 p-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span>Claim</span><span>Processing status</span><span>Priority</span><span>Submitted</span><span />
          </div>
          <div className="divide-y divide-slate-800">
            {filteredRecords.map((record) => (
              <div key={record._id} className="grid gap-3 p-4 md:grid-cols-[1.5fr_0.8fr_0.7fr_0.8fr_auto] md:items-center md:gap-4">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-slate-100">{record.claim}</p>
                  <p className="mt-1 text-xs text-slate-400">{record.language || "english"}</p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === "needs_review" ? "bg-amber-500/10 text-amber-200" : "bg-slate-800 text-slate-200"}`}>{label(record.status)}</span>
                <span className="text-sm text-slate-200">{label(record.priority)}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13} />{formatDate(record.createdAt)}</span>
                <button type="button" onClick={() => openDetails(record._id)} className="text-left text-sm font-semibold text-emerald-300 hover:text-emerald-200">View details</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isDetailLoading || detailError || selected) && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {isDetailLoading && <StateMessage>Loading verification details...</StateMessage>}
          {detailError && <StateMessage error>{detailError}</StateMessage>}
          {selected && !isDetailLoading && !detailError && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="text-lg font-semibold text-white">Verification details</h2><p className="mt-1 text-xs text-slate-400">{formatDate(selected.request?.createdAt)}</p></div>
                {selected.request?.reviewRequired && <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200"><AlertTriangle size={12} /> Needs Human Review</span>}
                <button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-300">Close</button>
              </div>
              <p className="mt-4 rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-200">{selected.request?.claim}</p>
              {selected.result ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-wide text-slate-400">Truth status</p><p className="mt-1 font-semibold text-white">{label(selected.result.truthStatus)}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-slate-400">Risk level</p><p className="mt-1 font-semibold text-white">{label(selected.result.riskLevel)}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-400">Summary</p><p className="mt-1 text-sm leading-6 text-slate-300">{selected.result.summary}</p></div>
                  {selected.result.confidence !== null && selected.result.confidence !== undefined && <div><p className="text-xs uppercase tracking-wide text-slate-400">Confidence</p><p className="mt-1 font-semibold text-white">{Math.round(selected.result.confidence * 100)}%</p></div>}
                  {selected.result.recommendedAction && <div><p className="text-xs uppercase tracking-wide text-slate-400">Recommended action</p><p className="mt-1 text-sm text-slate-300">{selected.result.recommendedAction}</p></div>}
                  {selected.result.uncertainties?.length > 0 && <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-400">Uncertainties</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">{selected.result.uncertainties.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
                  {selected.result.evidence?.length > 0 && <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-400">Evidence</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{selected.result.evidence.map((item, index) => <div key={item.evidenceId || index} className="rounded-lg border border-slate-700 bg-slate-950 p-3"><p className="text-sm font-medium text-white">{item.title || item.source || "Supplied source"}</p><p className="mt-1 text-xs text-slate-400">{item.sourceType || "Source type unavailable"}{item.date ? ` | ${item.date}` : ""}</p>{item.relevance && <p className="mt-2 text-sm text-slate-300">{item.relevance}</p>}{item.url && /^https?:\/\//i.test(item.url) && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-xs font-semibold text-emerald-300 underline">Open source</a>}</div>)}</div></div>}
                </div>
              ) : <p className="mt-5 flex items-center gap-2 text-sm text-slate-300"><ShieldCheck size={17} /> No verification result is recorded yet.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
