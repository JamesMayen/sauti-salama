import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { createCivicInformation, getCivicInformation, updateCivicInformation } from "../../services/civicService.js";
import { getSources } from "../../services/sourceService.js";

const categories = ["all", "rights", "services", "safety", "reporting", "governance", "elections", "documentation", "other"];
const languages = ["all", "english", "juba_arabic", "dinka", "nuer", "other"];
const label = (value) => value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";
const emptyForm = { title: "", summary: "", content: "", category: "other", language: "english", source: "", sourceUrl: "", isPublished: false };

function StateMessage({ children, error = false }) { return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>; }

export default function Civic() {
  const { user } = useAuthContext();
  const canManage = ["admin", "moderator"].includes(user?.role);
  const [items, setItems] = useState([]);
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadInformation = async () => {
    setIsLoading(true); setError("");
    try {
      const filters = {};
      if (category !== "all") filters.category = category;
      if (language !== "all") filters.language = language;
      if (search.trim()) filters.search = search.trim();
      const response = await getCivicInformation({
        ...filters,
        manage: true,
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) { setError(requestError.message || "We could not load civic information."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadInformation(); }, [category, language]);
  useEffect(() => { getSources({ active: "true" }).then((response) => setSources(Array.isArray(response.data) ? response.data : [])).catch(() => setSources([])); }, []);

  const submitInformation = async (event) => {
    event.preventDefault(); setIsSaving(true); setError("");
    const payload = { ...form, source: form.source || null, sourceUrl: form.sourceUrl || null };
    try { await createCivicInformation(payload); setForm(emptyForm); setShowForm(false); await loadInformation(); }
    catch (requestError) { setError(requestError.message || "We could not save this civic information."); }
    finally { setIsSaving(false); }
  };

  const togglePublished = async (item) => {
    setUpdatingId(item._id); setError("");
    try { const response = await updateCivicInformation(item._id, { isPublished: !item.isPublished }); setItems((current) => current.map((entry) => entry._id === item._id ? response.data : entry)); }
    catch (requestError) { setError(requestError.message || "We could not update this civic information."); }
    finally { setUpdatingId(""); }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Civic Information</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Search and manage civic information using the existing publication and source fields.</p></div><div className="flex gap-2"><button type="button" onClick={loadInformation} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>{canManage && <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close form" : "New resource"}</button>}</div></div>

    {showForm && canManage && <form onSubmit={submitInformation} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"><input required minLength={5} maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{categories.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><textarea required minLength={10} maxLength={2000} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Summary" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><textarea required minLength={10} maxLength={10000} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Full content" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{languages.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">No source selected</option>{sources.map((source) => <option key={source._id} value={source._id}>{source.name}</option>)}</select><input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="Source URL (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Publish resource</label><button type="submit" disabled={isSaving} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{isSaving ? "Saving..." : "Create resource"}</button></form>}

    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadInformation()} placeholder="Search title or summary" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:min-w-64" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : label(item)}</option>)}</select><select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{languages.map((item) => <option key={item} value={item}>{item === "all" ? "All languages" : label(item)}</option>)}</select><button type="button" onClick={loadInformation} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Search</button></div>
    {error && <StateMessage error>{error} <button type="button" onClick={loadInformation} className="ml-2 font-semibold underline">Try again</button></StateMessage>}
    {isLoading && !error && <StateMessage>Loading civic information...</StateMessage>}
    {!isLoading && !error && items.length === 0 && <StateMessage>No civic information available.</StateMessage>}
    {!isLoading && !error && items.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{label(item.category)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isPublished ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{item.isPublished ? "Published" : "Unpublished"}</span></div><h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2></div>{canManage && <button type="button" disabled={updatingId === item._id} onClick={() => togglePublished(item)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{item.isPublished ? "Unpublish" : "Publish"}</button>}</div><p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p><div className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500"><p>Language: {label(item.language)} · Updated: {formatDate(item.updatedAt || item.createdAt)}</p><p>Source: {item.source?.name || "Not provided"}</p>{item.sourceUrl && <p className="break-all">URL: {item.sourceUrl}</p>}</div></article>)}</div>}
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500"><BookOpen size={15} className="mr-2 inline text-slate-400" />Search is sent only when submitted or when category/language changes; no request is made on every keystroke.</div>
  </div>;
}
