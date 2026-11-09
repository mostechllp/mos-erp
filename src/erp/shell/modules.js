// ============================================================================
//  ERP navigation model.
//  One catalogue of "apps" (HR, Projects, CRM, Accounts, Administration), each
//  with titled groups of screens. Paths come from the app's existing route maps,
//  so nothing here invents a route.
// ============================================================================
import { ADMIN_ROUTE_MAP, EMPLOYEE_ROUTE_MAP } from "../../components/common/Sidebar";

const hr = (slug, label, icon, extra = {}) => ({ slug, label, icon, ...extra });
const acc = (slug, label, icon, admin, emp) => ({
  slug, label, icon, suite: "accounts", admin, emp: emp || admin.replace("/admin", "/employee"),
});
const crm = (slug, label, icon) => hr(slug, label, icon, { suite: "crm" });

export const MODULES = [
  {
    id: "hr", label: "HR & People", icon: "fa-users", color: "#3498db",
    blurb: "Employees, attendance, leave, payroll",
    groups: [
      { label: "Overview", items: [hr("dashboard", "HR Dashboard", "fa-chart-line")] },
      { label: "Workforce", items: [
        hr("employees", "Employees", "fa-users"), hr("onboarding", "Onboarding", "fa-user-plus"),
        hr("offboarding", "Offboarding", "fa-user-minus"), hr("documents", "Documents & Agreements", "fa-file-signature"),
      ] },
      { label: "Time & Leave", items: [
        hr("attendance", "Attendance", "fa-fingerprint"), hr("attendance-requests", "Attendance Requests", "fa-clock"),
        hr("my-attendance-requests", "My Attendance Requests", "fa-clock"), hr("wfh-requests", "WFH Requests", "fa-house-user"),
        hr("leaves", "Leave Management", "fa-calendar-check"), hr("my-leaves", "My Leaves", "fa-calendar-alt"),
      ] },
      { label: "Pay & Compliance", items: [
        hr("payroll", "Payroll", "fa-file-invoice-dollar"), hr("my-payroll", "My Payslips", "fa-file-invoice-dollar"),
        hr("warnings", "Warnings", "fa-triangle-exclamation"), hr("my-warnings", "My Warnings", "fa-triangle-exclamation"),
        hr("reports", "HR Reports", "fa-chart-bar"),
      ] },
    ],
  },
  {
    id: "projects", label: "Projects", icon: "fa-diagram-project", color: "#1abc9c",
    blurb: "Projects, tasks, reports, meetings",
    groups: [
      { label: "Delivery", items: [
        hr("projects", "Projects", "fa-folder"), hr("project-tasks", "Project Tasks", "fa-diagram-project"),
        hr("my-tasks", "My Tasks", "fa-user-check"), hr("task-reports", "Task Reports", "fa-tasks"),
      ] },
      { label: "Collaboration", items: [hr("meetings", "Meetings", "fa-calendar-days"), hr("my-meetings", "My Meetings", "fa-calendar-alt")] },
    ],
  },
  {
    id: "crm", label: "CRM & Sales", icon: "fa-handshake", color: "#f39c12",
    blurb: "Leads, pipeline, quotations",
    groups: [
      { label: "Overview", items: [crm("crm-dashboard", "Sales Dashboard", "fa-gauge-high")] },
      { label: "Pipeline", items: [
        crm("crm-leads", "Leads", "fa-user-tag"), crm("crm-opportunities", "Opportunities", "fa-bullseye"),
        crm("crm-activities", "Activities", "fa-phone-volume"),
      ] },
      { label: "Customers & Offers", items: [
        crm("crm-customers", "Customers", "fa-address-book"), crm("crm-quotations", "Quotations", "fa-file-invoice"),
        crm("crm-proposals", "Proposals", "fa-file-lines"), crm("crm-products", "Products & Services", "fa-box-open"),
      ] },
      { label: "Insights & Setup", items: [crm("crm-reports", "Sales Reports", "fa-chart-pie"), crm("crm-settings", "CRM Settings", "fa-sliders")] },
    ],
  },
  {
    id: "accounts", label: "Accounting", icon: "fa-calculator", color: "#9b59b6",
    blurb: "Sales, purchases, banking, books",
    groups: [
      { label: "Overview", items: [
        acc("accounts-dashboard", "Finance Dashboard", "fa-chart-pie", "/admin/accounts/dashboard"),
        acc("items", "Items", "fa-box", "/admin/accounts/items"),
      ] },
      { label: "Sales (Receivables)", items: [
        acc("sales-customers", "Customers", "fa-address-book", "/admin/accounts/sales/customers"),
        acc("sales-quotes", "Quotes", "fa-file-lines", "/admin/accounts/sales/quotes"),
        acc("sales-orders", "Sales Orders", "fa-cart-shopping", "/admin/accounts/sales/orders"),
        acc("sales-invoices", "Invoices", "fa-file-invoice", "/admin/accounts/sales/invoices"),
        acc("sales-recurring", "Recurring Invoices", "fa-rotate", "/admin/accounts/sales/recurring"),
        acc("sales-challans", "Delivery Challans", "fa-truck", "/admin/accounts/sales/challans"),
        acc("sales-payments", "Payments Received", "fa-hand-holding-dollar", "/admin/accounts/sales/payments"),
        acc("sales-credits", "Credit Notes", "fa-receipt", "/admin/accounts/sales/credit-notes"),
      ] },
      { label: "Purchases (Payables)", items: [
        acc("purchases-vendors", "Vendors", "fa-industry", "/admin/accounts/purchases/vendors"),
        acc("purchases-expenses", "Expenses", "fa-money-bill-wave", "/admin/accounts/purchases/expenses"),
        acc("purchases-recurring", "Recurring Expenses", "fa-rotate", "/admin/accounts/purchases/recurring-expenses", "/employee/accounts/purchases/recurring"),
        acc("purchases-orders", "Purchase Orders", "fa-cart-flatbed", "/admin/accounts/purchases/purchase-orders"),
        acc("purchases-bills", "Bills", "fa-file-invoice-dollar", "/admin/accounts/purchases/bills"),
        acc("purchases-recurring-bills", "Recurring Bills", "fa-rotate", "/admin/accounts/purchases/recurring-bills"),
        acc("purchases-payments", "Payments Made", "fa-money-check-dollar", "/admin/accounts/purchases/payments-made"),
        acc("purchases-credits", "Vendor Credits", "fa-receipt", "/admin/accounts/purchases/vendor-credits"),
      ] },
      { label: "Banking & Time", items: [
        acc("banking", "Banking", "fa-building-columns", "/admin/accounts/banking"),
        acc("time-projects", "Billable Projects", "fa-folder-open", "/admin/accounts/time-tracking/projects"),
        acc("time-timesheet", "Timesheets", "fa-stopwatch", "/admin/accounts/time-tracking/timesheet"),
      ] },
      { label: "Books & Controls", items: [
        acc("acc-journals", "Manual Journals", "fa-book", "/admin/accounts/accountant/manual-journals"),
        acc("acc-coa", "Chart of Accounts", "fa-sitemap", "/admin/accounts/accountant/chart-of-accounts"),
        acc("acc-budgets", "Budgets", "fa-scale-balanced", "/admin/accounts/accountant/budgets"),
        acc("acc-currency", "Currency Adjustments", "fa-coins", "/admin/accounts/accountant/currency-adjustments"),
        acc("acc-bulk", "Bulk Update", "fa-pen-to-square", "/admin/accounts/accountant/bulk-update"),
        acc("acc-locking", "Transaction Locking", "fa-lock", "/admin/accounts/accountant/transaction-locking"),
      ] },
      { label: "Reports & Files", items: [
        acc("accounts-reports", "Financial Reports", "fa-chart-column", "/admin/accounts/reports"),
        acc("account-documents", "Documents", "fa-folder-tree", "/admin/accounts/documents"),
      ] },
    ],
  },
  {
    id: "admin", label: "Administration", icon: "fa-gear", color: "#e74c3c",
    blurb: "Organisations, roles, settings",
    groups: [
      { label: "Setup", items: [
        hr("organizations", "Organisations & Companies", "fa-building"), hr("roles", "Roles & Permissions", "fa-user-shield"),
        hr("settings", "Settings", "fa-gear"),
      ] },
    ],
  },
];

export const itemPath = (item, isEmployee) =>
  isEmployee
    ? item.emp || EMPLOYEE_ROUTE_MAP[item.slug]
    : item.admin || ADMIN_ROUTE_MAP[item.slug];

export const itemAllowed = (item, user) => {
  const p = user?.permissions || {};
  if (p.all) return true;
  if (p[item.slug] !== undefined) return p[item.slug].read === true;
  if (user?.sidebar_modules?.some((m) => m.slug === item.slug && m.status === "active")) return true;
  if (item.suite && p[item.suite]?.read) return true;
  return false;
};

// Modules/groups/items this user can see, with resolved paths.
export const buildModules = (user) => {
  const emp = user?.type !== "admin";
  return MODULES.map((m) => {
    const groups = m.groups
      .map((g) => ({
        ...g,
        items: g.items
          .filter((i) => itemAllowed(i, user))
          .map((i) => ({ ...i, label: emp && i.slug === "dashboard" ? "My Dashboard" : i.label, to: itemPath(i, emp), moduleId: m.id, moduleLabel: m.label, groupLabel: g.label }))
          .filter((i) => i.to),
      }))
      .filter((g) => g.items.length);
    return { ...m, groups, items: groups.flatMap((g) => g.items) };
  }).filter((m) => m.items.length);
};

// Best (longest-prefix) match of a URL against the user's menu.
export const findByPath = (modules, pathname) => {
  let best = null;
  modules.forEach((m) => m.items.forEach((i) => {
    if (pathname === i.to || pathname.startsWith(`${i.to}/`)) {
      if (!best || i.to.length > best.to.length) best = i;
    }
  }));
  return best;
};
