# ACL (Access Control List) used in this project

This document extracts the exact ACL approach used in this repository so you can reuse the same method in another project. It covers the data model, server endpoints, client utilities, and the management workflow end‑to‑end.

## Overview

- Permissions are defined by numeric IDs mapped to routes and menu items in a single `ACL.json` file.
- Each user (employee/admin) has an `ACL` column in the database that stores a Base64-encoded, comma‑separated list of allowed IDs (e.g., `"MSwyLDMs..."` which decodes to `"1,2,3,..."`).
- On the server, the `ACL` string is decoded and sent to the client as an array of numbers.
- On the client, navigation is filtered by checking whether each item’s `id` is included in that decoded permissions array.
- An Admin UI lets you assign ACLs by picking pages/submenus, then saves them back as Base64.

## Data model

### ACL registry: `src/lib/jsons/ACL.json`

- An ordered array of menu items, each with:
  - `id` (number): Unique permission ID
  - `name` (string): Display name
  - `route` (string): Route path
  - `icon` (string, optional)
  - `submenu` (array, optional): List of submenu items, each with its own `id`, `name`, and `route`

Example (shortened):

```json
[
  { "id": 1, "name": "Dashboard", "route": "/", "icon": "Home" },
  {
    "id": 8,
    "name": "Clients",
    "route": "/clients",
    "icon": "Users",
    "submenu": [
      {
        "id": 9,
        "name": "Search Client",
        "route": "/clients",
        "icon": "Search"
      },
      {
        "id": 10,
        "name": "Add New Client",
        "route": "/clients/add",
        "icon": "Users"
      }
    ]
  }
]
```

### User record (database)

- Each user has an `ACL` column that stores Base64 of a comma-separated list of IDs, for example:
  - Plain text: `"1,2,3,4,5,7,8,9,10,11,12,13,14,15,18"`
  - Base64: `"MSwyLDMsNCw1LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE4"`

When inserting a new employee, a default ACL can be provided depending on role (see `src/app/api/employees/add/route.js`).

## Server endpoints

### Get decoded ACL for current admin

File: `src/app/api/admin/acl/route.js`

- Input (POST JSON): `{ "adminId": number }`
- Reads the employee’s `ACL` (Base64) from DB, decodes to CSV, splits into numbers, and returns:

```js
return new Response(
  JSON.stringify({
    code: "SUCCESS",
    data: {
      ...admin,
      permissions: decodedPermissions.split(",").map(Number),
    },
  }),
  { status: 200 }
);
```

### Update user ACL

File: `src/app/api/employees/update-acl/route.js`

- Input (POST JSON): `{ id: number, aclBase64: string }`
- Updates `employees.ACL` with the provided Base64 string.

## Client utilities

### Parsing permissions

File: `src/lib/permissions.js`

```js
import ACL from "../jsons/ACL.json";

class PermissionService {
  constructor(user) {
    this.user = user;
    this.permissions = this.parsePermissions(user.permissions);
  }

  // Parse base64 encoded permissions
  parsePermissions(base64Permissions) {
    if (!base64Permissions) return [];
    try {
      const decoded = atob(base64Permissions);
      return decoded.split(",").map(Number);
    } catch (error) {
      console.error("Error parsing permissions:", error);
      return [];
    }
  }

  // Optional helper for public routes
  isPublicRoute(route) {
    const publicRoutes = ["/", "/login", "/register", "/reset-password"];
    return publicRoutes.includes(route);
  }
}

export default PermissionService;
```

Note: In most places the server already returns `permissions` as an array of numbers, so the client often doesn’t need to decode Base64 itself unless you choose to.

### Filtering navigation by ACL

File: `src/components/Navbar/SideNav.jsx`

- Fetches decoded permissions via `POST /api/admin/acl` using the `user.id` stored in localStorage.
- Filters the in-memory `ACL` registry to show only allowed items:

```js
const filteredACL = ACL.filter((item) => {
  // Always show dashboard
  if (item.route === "/") return true;

  // If item has submenu, show if any submenu id is allowed
  if (item.submenu) {
    return item.submenu.some((subitem) => permissions.includes(subitem.id));
  }

  // Otherwise show if the item id is allowed
  return permissions.includes(item.id);
}).map((item) => {
  // Keep only allowed submenu items
  if (item.submenu) {
    return {
      ...item,
      submenu: item.submenu.filter((subitem) =>
        permissions.includes(subitem.id)
      ),
    };
  }
  return item;
});
```

### Reusable helper functions (extracted)

You can drop these helpers into any project to apply the same ACL rules consistently.

```js
// src/lib/acl-helpers.js
import ACL from "@/lib/jsons/ACL.json";

// Build a route -> id map once
export const buildRouteToIdMap = () => {
  const map = new Map();
  ACL.forEach((item) => {
    map.set(item.route, item.id);
    item.submenu?.forEach((sub) => map.set(sub.route, sub.id));
  });
  return map;
};

// Basic access check for a route
export const canAccessRoute = (
  permissions /* number[] */,
  route /* string */
) => {
  // Public routes are handled separately; include here only if desired
  if (["/", "/login", "/register", "/reset-password"].includes(route)) {
    return true;
  }

  const routeToId = buildRouteToIdMap();
  const id = routeToId.get(route);
  if (id == null) return false; // Unknown route
  return permissions.includes(id);
};

// Produce a filtered ACL tree for navigation rendering
export const filterACLByPermissions = (permissions /* number[] */) => {
  return ACL.filter((item) => {
    if (item.route === "/") return true; // Always show dashboard
    if (item.submenu) {
      return item.submenu.some((sub) => permissions.includes(sub.id));
    }
    return permissions.includes(item.id);
  }).map((item) => {
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter((sub) => permissions.includes(sub.id)),
      };
    }
    return item;
  });
};

// Decode a Base64 ACL string to number[] (server or client)
export const decodeAclBase64 = (base64 /* string | null | undefined */) => {
  if (!base64) return [];
  try {
    // In Node: Buffer; in browser: atob. This tries Buffer first.
    const raw =
      typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString()
        : atob(base64);
    return raw
      .split(",")
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
  } catch (e) {
    return [];
  }
};
```

Server-side usage example (Next.js route):

```js
// Example in an API route handler
import { connectDB } from "@/lib/db";
import { buildRouteToIdMap, decodeAclBase64 } from "@/lib/acl-helpers";

export const POST = async (req) => {
  const { adminId } = await req.json();
  const db = await connectDB();
  const [rows] = await db.execute("SELECT ACL FROM employees WHERE id = ?", [
    adminId,
  ]);
  if (!rows.length)
    return new Response(JSON.stringify({ code: "ERROR" }), { status: 404 });

  const permissions = decodeAclBase64(rows[0].ACL);
  const routeToId = buildRouteToIdMap();
  const needed = routeToId.get("/admin/ACL"); // example protected route
  if (!permissions.includes(needed)) {
    return new Response(JSON.stringify({ code: "FORBIDDEN" }), { status: 403 });
  }

  // ... proceed
  return new Response(JSON.stringify({ code: "SUCCESS" }), { status: 200 });
};
```

## ACL Management UI flow

File: `src/app/admin/ACL/page.js`

When opening "Manage ACL" for a user:

1. Read the user’s current Base64 `ACL` and decode: `atob(admin.ACL)`.
2. Parse it to numeric IDs, keep only valid IDs: `decoded.split(',').map(n => parseInt(n, 10))`.
3. Display selectable pages using `ACL.json`. For items with `submenu`, only include submenus whose IDs appear in the decoded list.
4. On save:
   - Build a map `route -> id` from `ACL.json` (including submenus).
   - Collect routes chosen in the UI, including child submenu routes.
   - Infer and include parent IDs for any selected submenu item.
   - Deduplicate and sort ascending.
   - Join with commas and `btoa()` the result to Base64.
   - POST `{ id, aclBase64 }` to `/api/employees/update-acl`.

Save algorithm (simplified excerpt):

```js
// Build route->id map
const routeToIdMap = new Map();
ACLData.forEach((page) => {
  routeToIdMap.set(page.route, page.id);
  page.submenu?.forEach((sub) => routeToIdMap.set(sub.route, sub.id));
});

// Collect selected routes and subroutes
const allSelectedRoutes = aclTable.flatMap((item) => [
  item.route,
  ...(item.submenu?.map((sub) => sub.route) || []),
]);

// Map to IDs and infer parents for any submenu selection
const selectedIds = allSelectedRoutes
  .map((route) => routeToIdMap.get(route))
  .filter((id) => id !== undefined);

const parentIds = new Set();
allSelectedRoutes.forEach((route) => {
  const parentPage = ACLData.find((page) =>
    page.submenu?.some((sub) => sub.route === route)
  );
  if (parentPage) parentIds.add(parentPage.id);
});

const uniqueSortedIds = Array.from(
  new Set([...parentIds, ...selectedIds])
).sort((a, b) => a - b);

const aclBase64 = btoa(uniqueSortedIds.join(","));
```

## How to reuse this ACL method in another project

1. Copy `src/lib/jsons/ACL.json` and adjust routes and IDs to match your new app.
2. Ensure your user table has an `ACL` column (string) to store Base64 of comma-separated IDs.
3. Implement two endpoints (or adapt to your stack):
   - `POST /api/admin/acl` → given a user/admin ID, return `{ code: "SUCCESS", data: { permissions: number[] } }`.
   - `POST /api/employees/update-acl` → save a provided Base64 string to the user’s `ACL` column.
4. In your client app:
   - Fetch decoded permissions on load for the logged-in user.
   - Filter your navigation or feature flags against `ACL.json` using the `permissions` array, like in `SideNav.jsx`.
5. Optionally implement an ACL management screen using the flow above to assign permissions interactively.

## Contract and assumptions

- Permission IDs are unique integers.
- Base64 string is always comma-separated IDs with no spaces (e.g. `"1,2,3"`).
- `ACL.json` is the single source of truth for route/id mapping — keep it in sync with your app’s routes.
- Public routes (like `/login`) are handled separately and don’t require permission checks.

## Edge cases & tips

- Missing or invalid Base64: treat as empty permissions `[]` and show only public routes (always allow `/`).
- Unknown IDs (not present in `ACL.json`): ignore them.
- Always include parent IDs when saving if any submenu is selected (see algorithm above).
- Sort and deduplicate IDs before saving to keep the stored value stable for diffs.

## Security notes

- Do not trust client-side checks alone. The client uses ACL mostly for UX (show/hide). Server routes that mutate or return sensitive data should also validate the user’s permissions on the server using the decoded array.
- If you cache user sessions/tokens, include role/permissions claims carefully and revalidate when ACL changes.

## Quick start checklist

- [ ] Add/adjust `ACL.json`
- [ ] Add `ACL` column to user table (string)
- [ ] Implement the two API endpoints for get/update ACL
- [ ] Filter navigation by the `permissions` array
- [ ] Optional ACL management page with Base64 save logic

---

Examples in this doc refer to:

- `src/lib/jsons/ACL.json`
- `src/lib/permissions.js`
- `src/components/Navbar/SideNav.jsx`
- `src/app/api/admin/acl/route.js`
- `src/app/api/employees/update-acl/route.js`
- `src/app/admin/ACL/page.js`
