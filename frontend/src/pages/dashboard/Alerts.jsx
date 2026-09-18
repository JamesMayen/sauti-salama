import { useEffect, useMemo, useState } from "react";
import { BellRing, MapPin, RefreshCw } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { createAlert, getAlerts, updateAlert } from "../../services/alertService.js";
import { sendAlertSms } from "../../services/smsService.js";

const statuses = ["all", "verified", "unverified", "contested", "emerging_signal"];
const categories = ["all", "security", "violence", "displacement", "misinformation", "service_disruption", "humanitarian", "other"];
const levels = ["low", "medium", "high", "critical"];
const label = (value) => value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";
const emptyForm = { title: "", summary: "", location: "", category: "other", status: "unverified", riskLevel: "medium", isPublished: false };

function StateMessage({ children, error = false }) { return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>; }

export default function Alerts() {
  const { user } = useAuthContext();
  const canManage = ["admin", "moderator"].includes(user?.role);
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsAlertId, setSmsAlertId] = useState("");

  const loadAlerts = async () => {
    setIsLoading(true); setError("");
    try { const response = await getAlerts(); setAlerts(Array.isArray(response.data) ? response.data : []); }
    catch (requestError) { setError(requestError.message || "We could not load alerts."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const filteredAlerts = useMemo(() => alerts.filter((alert) => (status === "all" || alert.status === status) && (category === "all" || alert.category === category)), [alerts, status, category]);

  const submitAlert = async (event) => {
    event.preventDefault(); setIsSaving(true); setError("");
    try { await createAlert(form); setForm(emptyForm); setShowForm(false); await loadAlerts(); }
    catch (requestError) { setError(requestError.message || "We could not save this alert."); }
    finally { setIsSaving(false); }
  };

  const changeAlert = async (id, payload) => {
    setUpdatingId(id); setError("");
    try { const response = await updateAlert(id, payload); setAlerts((current) => current.map((alert) => alert._id === id ? response.data : alert)); }
    catch (requestError) { setError(requestError.message || "We could not update this alert."); }
    finally { setUpdatingId(""); }
  };

  const notifyBySms = async (alert) => {
    setSmsAlertId(alert._id);
    setError("");
    try {
      await sendAlertSms(alert._id, smsRecipient);
      setSmsRecipient("");
    } catch (requestError) {
      setError(requestError.message || "We could not send the alert SMS.");
    } finally {
      setSmsAlertId("");
    }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Alerts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review published and unpublished alerts returned by the alert service.</p></div>
      <div className="flex gap-2"><button type="button" onClick={loadAlerts} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>{canManage && <button type="button" onClick={() => setShowForm((current) => !current)} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">{showForm ? "Close form" : "New alert"}</button>}</div>
    </div>

    {showForm && canManage && <form onSubmit={submitAlert} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <input required minLength={5} maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Alert title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input required minLength={2} maxLength={200} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <textarea required minLength={10} maxLength={2000} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Summary" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{categories.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>
      <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{statuses.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>
      <select value={form.riskLevel} onChange={(event) => setForm({ ...form, riskLevel: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{levels.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Publish alert</label>
      <button type="submit" disabled={isSaving} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{isSaving ? "Saving..." : "Create alert"}</button>
    </form>}

    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : label(item)}</option>)}</select><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : label(item)}</option>)}</select></div>
    {error && <StateMessage error>{error} <button type="button" onClick={loadAlerts} className="ml-2 font-semibold underline">Try again</button></StateMessage>}
    {isLoading && !error && <StateMessage>Loading alerts...</StateMessage>}
    {!isLoading && !error && filteredAlerts.length === 0 && <StateMessage>No alerts found.</StateMessage>}
    {!isLoading && !error && filteredAlerts.length > 0 && <div className="space-y-4">{filteredAlerts.map((alert) => <article key={alert._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{label(alert.status)}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{label(alert.riskLevel)} risk</span></div><h2 className="mt-3 text-lg font-semibold text-slate-900">{alert.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{alert.summary}</p></div>{canManage && <div className="flex shrink-0 flex-col gap-2"><select disabled={updatingId === alert._id} value={alert.status} onChange={(event) => changeAlert(alert._id, { status: event.target.value })} className="rounded-lg border border-slate-300 px-2 py-2 text-xs"><option value="verified">Verified</option><option value="unverified">Unverified</option><option value="contested">Contested</option><option value="emerging_signal">Emerging signal</option></select><button type="button" disabled={updatingId === alert._id} onClick={() => changeAlert(alert._id, { isPublished: !alert.isPublished })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{alert.isPublished ? "Unpublish" : "Publish"}</button>{alert.isPublished && <><input value={smsRecipient} onChange={(event) => setSmsRecipient(event.target.value)} placeholder="+211..." className="rounded-lg border border-slate-300 px-2 py-2 text-xs" /><button type="button" disabled={smsAlertId === alert._id || !smsRecipient.trim()} onClick={() => notifyBySms(alert)} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800">{smsAlertId === alert._id ? "Sending..." : "Send alert SMS"}</button></>}</div>}</div><div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={13} />{alert.location}</span><span>Category: {label(alert.category)}</span><span>Created: {formatDate(alert.createdAt)}</span><span>Source: {alert.source?.name || "Not provided"}</span></div></article>)}</div>}
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500"><BellRing size={15} className="mr-2 inline text-slate-400" />Create and update controls follow the existing backend endpoints; backend authorization remains authoritative.</div>
  </div>;
}
