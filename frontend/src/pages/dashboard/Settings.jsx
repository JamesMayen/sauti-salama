import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <SettingsIcon size={23} />
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-slate-900">
          Settings
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Platform settings, administrator preferences, and configuration
          controls will appear here.
        </p>

        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-slate-400">
          Dashboard module — prototype
        </p>
      </div>
    </div>
  );
}