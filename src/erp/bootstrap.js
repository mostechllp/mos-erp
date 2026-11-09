// Imported FIRST in main.jsx so it runs before the Redux store reads localStorage.
// In demo mode there is no login screen to get through: we create a session for the
// last-used (or default) role, so the app opens straight into the ERP.
import { DEMO_MODE, getStoredRoleId, writeSession } from "./demoSession";

if (DEMO_MODE) {
  writeSession(getStoredRoleId());
}
