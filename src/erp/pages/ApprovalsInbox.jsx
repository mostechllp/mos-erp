import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useApprovals, decideLeave } from "../shell/useApprovals";

const TABS = [
  { id: "all", label: "All" },
  { id: "leave", label: "Leave approvals" },
  { id: "sales", label: "Sales follow-ups", kinds: ["followup", "quote"] },
  { id: "compliance", label: "Compliance" },
];
const ago = (d) => {
  if (!d) return "";
  const days = Math.round((new Date(d).getTime() - Date.now()) / 86400000);
  return days === 0 ? "today" : days > 0 ? `in ${days}d` : `${-days}d ago`;
};

/** One inbox for everything that is waiting on the user, across HR, CRM and compliance. */
const ApprovalsInbox = () => {
  const { user } = useSelector((s) => s.auth);
  const base = user?.type !== "admin" ? "/employee" : "/admin";
  const { items, loading, refresh } = useApprovals(user);
  const [tab, setTab] = useState("all");
  const [busy, setBusy] = useState(null);
  const match = (i, t) => t.id === "all" || i.kind === t.id || t.kinds?.includes(i.kind);
  const rows = items.filter((i) => match(i, TABS.find((t) => t.id === tab)));
  const canDecide = user?.permissions?.all || user?.permissions?.leaves?.update || user?.permissions?.leaves?.read;

  const decide = async (i, status) => {
    setBusy(i.id);
    try { await decideLeave(i.leaveId, status, user); toast.success(`Leave ${status}`); }
    catch { toast.error("Could not update the request"); }
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Approvals & Inbox</h1>
          <p className="text-sm text-gray-500">Everything waiting on you across HR, CRM and compliance.</p>
        </div>
        <button onClick={refresh} className="ml-auto text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
          <i className={`fas fa-rotate mr-2 ${loading ? "fa-spin" : ""}`}></i>Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = items.filter((i) => match(i, t)).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === t.id ? "bg-green-500 text-white border-green-500" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
              {t.label} <span className={`ml-1 ${tab === t.id ? "text-green-100" : "text-gray-400"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {rows.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <i className="fas fa-circle-check text-3xl text-green-400 mb-3"></i>
            <p className="text-sm">{loading ? "Loading…" : "Nothing waiting here. Nice work."}</p>
          </div>
        )}
        {rows.map((i) => (
          <div key={i.id} className="flex items-center gap-4 p-4">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: i.color }}><i className={`fas ${i.icon}`}></i></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{i.title}</p>
              <p className="text-xs text-gray-500 truncate">{i.subtitle}</p>
            </div>
            <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{i.module}</span>
            <span className={`hidden md:block text-xs w-20 text-right ${i.urgent ? "text-red-500 font-semibold" : "text-gray-400"}`}>{ago(i.due)}</span>
            {i.actionable && canDecide ? (
              <div className="flex gap-2">
                <button disabled={busy === i.id} onClick={() => decide(i, "approved")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">Approve</button>
                <button disabled={busy === i.id} onClick={() => decide(i, "rejected")} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">Reject</button>
              </div>
            ) : i.to ? (
              <Link to={`${base}${i.to}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Open</Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsInbox;
