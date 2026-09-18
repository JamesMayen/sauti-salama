import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Error 404
        </p>

        <h1 className="mt-3 font-serif text-5xl font-semibold text-slate-900">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-slate-600">
          The page you are looking for doesn't exist or may have
          moved.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;