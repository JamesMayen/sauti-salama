import { useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui";
import { getSmsMessages, sendSms } from "../../services/smsService.js";

const types = [
  "report_acknowledgement",
  "report_status",
  "verification_result",
  "alert_notification",
];

const label = (value) =>
  value?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Not available";

function StateMessage({ children, error = false }) {
  return <div className={`rounded-xl border p-5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{children}</div>;
}

export default function Sms() {
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ recipient: "", messageType: "report_acknowledgement", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMessages = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getSmsMessages();
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || "We could not load SMS messages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const stats = useMemo(() => messages.reduce((counts, message) => {
    counts.total += 1;
    counts[message.status] = (counts[message.status] || 0) + 1;
    return counts;
  }, { total: 0 }), [messages]);

  const submitMessage = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await sendSms(form);
      setMessages((current) => [response.data, ...current]);
      setForm({ ...form, recipient: "", message: "" });
      setSuccess("SMS request processed. Check the status before assuming delivery.");
    } catch (requestError) {
      setError(requestError.message || "We could not send this SMS.");
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-green-700">Communications</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">SMS</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review protected SMS activity and intentionally send concise operational messages. Mock messages are simulated, not delivered.</p></div>
      <button type="button" onClick={loadMessages} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[['Total', stats.total], ['Simulated', stats.simulated || 0], ['Sent', stats.sent || 0], ['Delivered', stats.delivered || 0], ['Failed', stats.failed || 0]].map(([title, value]) => <Card key={title} className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></Card>)}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5">
        <div className="flex items-center gap-3"><MessageSquare size={20} className="text-green-700" aria-hidden="true" /><h2 className="font-semibold text-slate-900">Send operational SMS</h2></div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Use only for authorized, necessary communication. Recipients must use South Sudan numbers.</p>
        <form onSubmit={submitMessage} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Recipient<input required value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} placeholder="+211..." className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-sm font-semibold text-slate-700">Message type<select value={form.messageType} onChange={(event) => setForm({ ...form, messageType: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{types.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></label>
          <label className="block text-sm font-semibold text-slate-700">Message<textarea required maxLength={1600} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <p className="text-right text-xs text-slate-400">{form.message.length}/1600</p>
          <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Sending..." : "Send SMS"}</button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Recent messages</h2><p className="mt-1 text-xs text-slate-500">Recipient numbers are masked for privacy.</p></div>
        {error && <div className="p-5"><StateMessage error>{error}</StateMessage></div>}
        {success && <div className="p-5"><StateMessage>{success}</StateMessage></div>}
        {isLoading && <div className="p-5"><StateMessage>Loading SMS messages...</StateMessage></div>}
        {!isLoading && !error && messages.length === 0 && <div className="p-5"><StateMessage>No SMS messages yet.</StateMessage></div>}
        {!isLoading && !error && messages.length > 0 && <div className="divide-y divide-slate-100">{messages.map((message) => <div key={message._id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-start"><div><p className="text-sm font-semibold text-slate-800">{message.recipient}</p><p className="mt-1 text-xs text-slate-500">{label(message.messageType)} | {message.provider}</p><p className="mt-2 text-sm text-slate-600">{message.message}</p></div><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{label(message.status)}</span></div>)}</div>}
      </Card>
    </div>
  </div>;
}
