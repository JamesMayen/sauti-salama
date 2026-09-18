import { useEffect, useState } from "react";
import { Activity, BellRing, Clock3, FileWarning, MapPin, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { getAlerts } from "../services/alertService.js";
import { getCivicInformation } from "../services/civicService.js";
import { getReports } from "../services/reportService.js";
import { getSources } from "../services/sourceService.js";
import { getVerifications } from "../services/verificationService.js";

const label = (value) => value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";
const emptyData = { verifications: [], reports: [], alerts: [], civic: [], sources: [] };

const requests = [
  ["verifications", () => getVerifications()],
  ["reports", () => getReports()],
  ["alerts", () => getAlerts({ published: "true" })],
  ["civic", () => getCivicInformation({ published: "true" })],
  ["sources", () => getSources({ active: "true" })],
];

function StatCard({ label: title, value, detail, icon: Icon }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700"><Icon size={21} /></div><TrendingUp size={17} className="text-slate-300" /></div><p className="mt-5 text-sm text-slate-500">{title}</p><p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></Card>;
}

function StateMessage({ children, error = false }) { return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>; }

export default function Dashboard() {
  const [data, setData] = useState(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setIsLoading(true); setError("");
    const results = await Promise.allSettled(requests.map(([, request]) => request()));
    const nextData = { ...emptyData };
    const failures = [];
    results.forEach((result, index) => {
      const [key] = requests[index];
      if (result.status === "fulfilled") nextData[key] = Array.isArray(result.value.data) ? result.value.data : [];
      else failures.push(key);
    });
    setData(nextData);
    if (failures.length) setError(`Some dashboard data could not be loaded: ${failures.join(", ")}.`);
    setIsLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  const verificationStatuses = data.verifications.reduce((counts, item) => { counts[item.status] = (counts[item.status] || 0) + 1; return counts; }, {});
  const reportStatuses = data.reports.reduce((counts, item) => { counts[item.status] = (counts[item.status] || 0) + 1; return counts; }, {});
  const stats = [
    { label: "Verification requests", value: data.verifications.length, detail: Object.entries(verificationStatuses).map(([key, value]) => `${label(key)}: ${value}`).join(" · ") || "No records", icon: ShieldCheck },
    { label: "Community reports", value: data.reports.length, detail: Object.entries(reportStatuses).map(([key, value]) => `${label(key)}: ${value}`).join(" · ") || "No records", icon: FileWarning },
    { label: "Published alerts", value: data.alerts.length, detail: "Published records returned by API", icon: BellRing },
    { label: "Civic information", value: data.civic.length, detail: `${data.sources.length} active sources available`, icon: Activity },
  ];

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Overview</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Operations dashboard</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Monitor verification requests, community reports, published alerts, civic information, and source records.</p></div><button type="button" onClick={loadDashboard} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button></div>
    {error && <div className="mb-6"><StateMessage error>{error}</StateMessage></div>}
    {isLoading ? <StateMessage>Loading dashboard data...</StateMessage> : <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold text-slate-900">Recent reports</h2><p className="mt-1 text-xs text-slate-400">Latest records returned by the reporting API</p></div><Link to="/dashboard/reports" className="text-xs font-semibold text-green-700">View all</Link></div>{data.reports.length === 0 ? <p className="p-5 text-sm text-slate-500">No reports available.</p> : <div className="divide-y divide-slate-100">{data.reports.slice(0, 5).map((report) => <div key={report._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="line-clamp-1 text-sm font-semibold text-slate-800">{report.description}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400"><span className="flex items-center gap-1"><MapPin size={13} />{report.location}</span><span className="flex items-center gap-1"><Clock3 size={13} />{formatDate(report.createdAt)}</span></div></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{label(report.status)}</span></div>)}</div>}</Card>
        <Card className="overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Recent alerts</h2><p className="mt-1 text-xs text-slate-400">Published records only</p></div>{data.alerts.length === 0 ? <p className="p-5 text-sm text-slate-500">No active alerts.</p> : <div className="divide-y divide-slate-100">{data.alerts.slice(0, 5).map((alert) => <div key={alert._id} className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-slate-800">{alert.title}</h3><span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">{label(alert.status)}</span></div><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><MapPin size={13} />{alert.location}</p></div>)}</div>}</Card>
      </div>
      <Card className="mt-6 p-6"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700"><Activity size={21} /></div><div><h2 className="font-semibold text-slate-900">Platform activity</h2><p className="mt-1 text-sm leading-6 text-slate-500">{data.verifications.length} verification requests, {data.reports.length} reports, {data.alerts.length} published alerts, {data.civic.length} published civic records, and {data.sources.length} active sources are available from the current API responses.</p></div></div></Card>
    </>}
  </div>;
}
