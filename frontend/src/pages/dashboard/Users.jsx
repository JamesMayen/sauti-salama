import { Users as UsersIcon } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { Card } from "../../components/ui";

export default function Users() {
  const { user } = useAuthContext();

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-8 sm:p-10">
          <h1 className="text-2xl font-semibold text-slate-900">
            You do not have permission to access this section.
          </h1>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Card className="p-8 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <UsersIcon size={23} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-900">
          Users
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          User management is reserved for a later dashboard phase. No user
          records or management actions are available here yet.
        </p>
      </Card>
    </div>
  );
}
