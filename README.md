# MOS ERP (demo)

HRMS + CRM + Accounts + Employee portal in one app, built on the Mostech HRMS codebase
(same structure, styling, Redux slices and API client).

## Run
    npm install
    npm run dev          # http://localhost:5173  (opens straight into the ERP, no login)

## Demo mode
- `VITE_DEMO_MODE=true` (default, see `.env`): all API calls are answered by an in-browser
  mock backend (`src/erp/mock/`). Edits persist in localStorage.
- Header **Demo role** dropdown switches between 8 roles; sidebar, portal and allowed pages follow the role.
- Reset demo data: `localStorage.removeItem("erp-demo-db-v1")` then reload.

## Real backend
Set `VITE_DEMO_MODE=false` and `VITE_API_URL=https://your-api/api` (see `.env.example`).
The role switcher is hidden and the normal login flow is used.

## Where things are
- `src/erp/roles.js`     role definitions (type, permissions, sidebar modules, allowed routes)
- `src/erp/RoleSwitcher.jsx`  header dropdown
- `src/erp/mock/`        seed data + mock API adapter (add endpoints in `adapter.js`)
- Edited originals: `main.jsx`, `utils/apiClient.js`, `store/slices/authSlice.js`,
  `shared/components/ProtectedRoute.jsx`, `components/common/Sidebar.jsx`, both `Header.jsx`.

## ERP shell (new)
- `src/erp/shell/ErpSidebar.jsx`   app switcher, module-scoped grouped nav, pins, recents, collapse
- `src/erp/shell/modules.js`       the navigation model (apps -> groups -> screens, using the existing route maps)
- `src/erp/shell/CommandPalette.jsx`  Ctrl/Cmd+K global search
- `src/erp/shell/PageBar.jsx`      breadcrumbs + pin
- `src/erp/pages/ErpHome.jsx`      launchpad home; `ApprovalsInbox.jsx` cross-module inbox
- `ERP_GAP_ANALYSIS.md`            research findings and what is / is not done
