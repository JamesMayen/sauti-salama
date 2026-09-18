import { useEffect, useMemo, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { createSource, getSources, updateSource } from "../../services/sourceService.js";

const types = ["all", "official", "institutional", "independent_media", "community", "international", "user_submitted", "other"];
const reliabilityLevels = ["all", "high", "medium", "unknown"];
const label = (value) => value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";
const emptyForm = { name: "", url: "", type: "other", reliabilityLevel: "unknown", description: "", isActive: true };

function StateMessage({ children, error = false }) { return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>; }

export default function Sources() {
  const { user } = useAuthContext();
  const canManage = ["admin", "moderator"].includes(user?.role);
  const [sources, setSources] = useState([]);
  const [type, setType] = useState("all");
  const [reliabilityLevel, setReliabilityLevel] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadSources = async () => {
    setIsLoading(true); setError("");
    try { const filters = {}; if (type !== "all") filters.type = type; if (reliabilityLevel !== "all") filters.reliabilityLevel = reliabilityLevel; const response = await getSources(filters); setSources(Array.isArray(response.data) ? response.data : []); }
    catch (requestError) { setError(requestError.message || "We could not load sources."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadSources(); }, [type, reliabilityLevel]);
  const visibleSources = useMemo(() => sources, [sources]);

  const submitSource = async (event) => {
    event.preventDefault(); setIsSaving(true); setError("");
    try { await createSource({ ...form, url: form.url || null, description: form.description || null }); setForm(emptyForm); setShowForm(false); await loadSources(); }
    catch (requestError) { setError(requestError.message || "We could not save this source."); }
    finally { setIsSaving(false); }
  };

  const toggleActive = async (source) => {
    setUpdatingId(source._id); setError("");
    try { const response = await updateSource(source._id, { isActive: !source.isActive }); setSources((current) => current.map((item) => item._id === source._id ? response.data : item)); }
    catch (requestError) { setError(requestError.message || "We could not update this source."); }
    finally { setUpdatingId(""); }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Sources</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage source references and the reliability metadata explicitly returned by the backend.</p></div><div className="flex gap-2"><button type="button" onClick={loadSources} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>{canManage && <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close form" : "New source"}</button>}</div></div>

    {showForm && canManage && <form onSubmit={submitSource} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"><input required minLength={2} maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Source name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{types.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="URL (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={form.reliabilityLevel} onChange={(event) => setForm({ ...form, reliabilityLevel: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{reliabilityLevels.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><textarea maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description (optional)" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" /><button type="submit" disabled={isSaving} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{isSaving ? "Saving..." : "Create source"}</button></form>}

    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{types.map((item) => <option key={item} value={item}>{item === "all" ? "All types" : label(item)}</option>)}</select><select value={reliabilityLevel} onChange={(event) => setReliabilityLevel(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{reliabilityLevels.map((item) => <option key={item} value={item}>{item === "all" ? "All reliability levels" : label(item)}</option>)}</select></div>
    {error && <StateMessage error>{error} <button type="button" onClick={loadSources} className="ml-2 font-semibold underline">Try again</button></StateMessage>}
    {isLoading && !error && <StateMessage>Loading sources...</StateMessage>}
    {!isLoading && !error && visibleSources.length === 0 && <StateMessage>No sources found.</StateMessage>}
    {!isLoading && !error && visibleSources.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{visibleSources.map((source) => <article key={source._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{label(source.type)}</span><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Reliability: {label(source.reliabilityLevel)}</span></div><h2 className="mt-3 text-lg font-semibold text-slate-900">{source.name}</h2></div>{canManage && <button type="button" disabled={updatingId === source._id} onClick={() => toggleActive(source)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{source.isActive ? "Deactivate" : "Activate"}</button>}</div>{source.description && <p className="mt-3 text-sm leading-6 text-slate-600">{source.description}</p>}{source.url && <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm text-green-700 underline">{source.url}</a>}<p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">Last checked: {formatDate(source.lastCheckedAt)} · Created: {formatDate(source.createdAt)}</p></article>)}</div>}
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500"><Database size={15} className="mr-2 inline text-slate-400" />Reliability labels are displayed only as stored by the backend; no additional trust score is inferred.</div>
  </div>;
}
