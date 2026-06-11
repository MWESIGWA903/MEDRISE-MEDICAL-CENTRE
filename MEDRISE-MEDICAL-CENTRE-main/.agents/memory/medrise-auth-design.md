---
name: MedRise auth design
description: Portal access rules, cross-portal access for owner/admin, force-password-change flow
---

**Portal rules:**
- Admin portal (`/admin/login` → `/admin/dashboard`): accepts roles `["admin", "owner"]` only
- Staff portal (`/staff/login` → `/staff/dashboard`): accepts ALL roles (including owner/admin)
- Non-admin trying to access admin dashboard → redirected to `/staff/dashboard`
- Admin/owner in staff portal → allowed (no redirect); sees all tabs per TAB_CONFIG

**Tab access:** Controlled by `TAB_CONFIG` in `dashboard.tsx`. Admin-only tabs: billing, attendance, staff accounts, reports, audit-log. Clinical tabs: EHR, lab, pharmacy. All others: everyone.

**Force password change:**
- DB column: `must_change_password` boolean, default `true` (set on new accounts)
- On login: API returns `mustChangePassword: boolean`
- Login pages: if `mustChangePassword === true`, set `localStorage.setItem("medrise_must_change_pwd", "true")`
- Dashboard: on `adminMe` load, check localStorage key → if true, open force-change dialog (non-dismissable)
- On successful password change: API sets `must_change_password = false`; frontend clears localStorage key

**Accounts (as of setup):**
- `Hannington` / role=owner / mustChangePassword=false (Medical Director — full access to both portals)
- `staff` / role=staff / mustChangePassword=true (default staff account, forced to change on first login)
