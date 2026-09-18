import { useEffect, useMemo, useState } from "react";
import { Clock3, FileWarning, MapPin, RefreshCw } from "lucide-react";
import { getReports, updateReportStatus } from "../../services/reportService.js";

const statuses = ["all", "received", "under_review", "verified", "unverified", "closed"];
const categories = ["all", "security", "violence", "displacement", "misinformation", "service_disruption", "humanitarian", "other"];

const label = (value) => value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";
const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";

function StateMessage({ children, error = false }) {
  return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>;
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadReports = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getReports();
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || "We could not load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const filteredReports = useMemo(() => reports.filter((report) =>
    (status === "all" || report.status === status) &&
    (category === "all" || report.category === category)
  ), [reports, status, category]);

  const handleStatusChange = async (reportId, nextStatus) => {
    setUpdatingId(reportId);
    setError("");
    try {
      const response = await updateReportStatus(reportId, nextStatus);
      const updated = response.data;
      setReports((current) => current.map((report) => report._id === reportId ? updated : report));
    } catch (requestError) {
      setError(requestError.message || "We could not update this report.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Operations</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review community submissions using the fields returned by the reporting API.</p></div>
        <button type="button" onClick={loadReports} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : label(item)}</option>)}</select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : label(item)}</option>)}</select>
      </div>

      {error && <StateMessage error>{error} <button type="button" onClick={loadReports} className="ml-2 font-semibold underline">Try again</button></StateMessage>}
      {isLoading && !error && <StateMessage>Loading reports...</StateMessage>}
      {!isLoading && !error && filteredReports.length === 0 && <StateMessage>No reports available.</StateMessage>}

      {!isLoading && !error && filteredReports.length > 0 && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 p-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Report</span><span>Category</span><span>Urgency</span><span>Submitted</span><span>Status</span></div>
        <div className="divide-y divide-slate-100">{filteredReports.map((report) => <div key={report._id} className="grid gap-3 p-4 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] md:items-center md:gap-4">
          <div className="min-w-0"><p className="line-clamp-2 text-sm font-medium text-slate-800">{report.description}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={13} />{report.location}</span><span className="flex items-center gap-1"><Clock3 size={13} />{formatDate(report.createdAt)}</span></div></div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{label(report.category)}</span>
          <span className="text-sm text-slate-600">{label(report.urgency)}</span>
          <span className="text-xs text-slate-500">{formatDate(report.incidentDate || report.createdAt)}</span>
          <select value={report.status || "received"} disabled={updatingId === report._id} onChange={(event) => handleStatusChange(report._id, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">{statuses.slice(1).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>
        </div>)}</div>
      </div>}

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500"><FileWarning size={15} className="mr-2 inline text-slate-400" />Reporter contact fields are not displayed. Anonymous reports remain privacy-protected by the backend response.</div>
    </div>
  );
}
