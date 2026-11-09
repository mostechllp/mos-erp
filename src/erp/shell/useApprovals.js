import { useCallback, useEffect, useSyncExternalStore } from "react";
import apiClient from "../../utils/apiClient";

// Cross-module "needs my attention" feed, built only from the app's existing APIs:
//   leave requests  -> GET /admin/leaves             (approve/reject: POST /admin/leaves/:id/status)
//   sales follow-up -> GET /admin/crm/activities     (overdue / pending)
//   quotations      -> GET /admin/crm/quotations     (draft, waiting to be sent)
//   compliance      -> GET /admin/employees          (visa expiring soon)
const listOf = (res) => {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(res?.data) ? res.data : [];
};
const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

let state = { items: [], loading: false, loaded: false };
const subs = new Set();
const set = (patch) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };

const safe = async (url, params) => {
  try { return listOf(await apiClient.get(url, { params })); } catch { return []; }
};

export const refreshApprovals = async (user) => {
  const p = user?.permissions || {};
  const can = (...keys) => p.all || keys.some((k) => p[k]?.read);
  set({ loading: true });
  const [leaves, acts, quotes, emps] = await Promise.all([
    can("leaves") ? safe("/admin/leaves", { per_page: 100 }) : [],
    can("crm-activities") ? safe("/admin/crm/activities", { per_page: 100 }) : [],
    can("crm-quotations") ? safe("/admin/crm/quotations", { per_page: 100 }) : [],
    can("employees") ? safe("/admin/employees", { per_page: 100 }) : [],
  ]);
  const items = [];
  leaves.filter((l) => String(l.status).toLowerCase() === "pending").forEach((l) => items.push({
    id: `leave-${l.id}`, kind: "leave", module: "HR", icon: "fa-calendar-check", color: "#3498db",
    title: `${l.employee?.name || "Employee"} · ${l.leave_type?.name || l.leave_type || "Leave"}`,
    subtitle: `${l.start_date} → ${l.end_date} · ${l.duration_days || 1} day(s)${l.reason ? " · " + l.reason : ""}`,
    due: l.created_at, leaveId: l.id, actionable: true,
  }));
  acts.filter((a) => ["overdue", "pending"].includes(String(a.status).toLowerCase())).forEach((a) => items.push({
    id: `act-${a.id}`, kind: "followup", module: "CRM", icon: "fa-phone-volume", color: "#f39c12",
    title: `${a.subject || a.title} · ${a.related_record_label || ""}`,
    subtitle: `${a.activity_type || "Task"} · ${a.status} · ${a.assigned_employee_name || ""}`,
    due: a.start_date_time, to: "/crm/activities", urgent: String(a.status).toLowerCase() === "overdue",
  }));
  quotes.filter((q) => String(q.status).toLowerCase() === "draft").forEach((q) => items.push({
    id: `qt-${q.id}`, kind: "quote", module: "CRM", icon: "fa-file-invoice", color: "#f39c12",
    title: `Quotation ${q.quotation_number} is still a draft`,
    subtitle: `${q.customer_name} · AED ${Number(q.grand_total || 0).toLocaleString("en-US")}`,
    due: q.quotation_date, to: `/crm/quotations/${q.id}`,
  }));
  emps.filter((e) => e.visa_expiry && daysUntil(e.visa_expiry) <= 45).forEach((e) => items.push({
    id: `visa-${e.id}`, kind: "compliance", module: "HR", icon: "fa-passport", color: "#e74c3c",
    title: `${e.name}: visa expires in ${Math.max(0, daysUntil(e.visa_expiry))} days`,
    subtitle: `${e.user?.department?.name || ""} · expiry ${e.visa_expiry}`,
    due: e.visa_expiry, to: `/employees/${e.id}`, urgent: daysUntil(e.visa_expiry) <= 15,
  }));
  set({ items, loading: false, loaded: true });
};

export const decideLeave = async (id, status, user) => {
  await apiClient.post(`/admin/leaves/${id}/status`, { status, processed_by: user?.id });
  await refreshApprovals(user);
};

export const useApprovals = (user) => {
  const snap = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
  const refresh = useCallback(() => refreshApprovals(user), [user]);
  useEffect(() => { if (!state.loaded && !state.loading && user) refresh(); }, [user, refresh]);
  return { ...snap, refresh };
};
