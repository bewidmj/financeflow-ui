# FinanceFlow UI

A React and TypeScript client for the FinanceFlow identity and finance APIs.

## Run locally

Prerequisites: Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Start the backend services separately:

- FinanceFlow API at `http://localhost:8080`
- Identity Service at `http://localhost:8081`

Vite proxies `/finance` to FinanceFlow, `/identity` to Identity Service, and
`/account-api` to Account Service. The account API proxy uses a separate prefix
from the UI's `/accounts` route so reloading that route serves the application.
Requests are same-origin in local development, so backend CORS is not required.

## Commands

```sh
npm run dev        # Start Vite
npm run typecheck  # TypeScript project check
npm run lint       # Lint source files
npm test           # Run unit and component tests
npm run build      # Typecheck and create the production bundle
npm run preview    # Preview the production bundle
```

## Configuration

Copy `.env.example` to `.env.local` to override:

- `VITE_FINANCEFLOW_API_URL`: finance API base URL (default `/finance`)
- `VITE_IDENTITY_API_URL`: identity API base URL (default `/identity`)
- `VITE_ACCOUNT_API_URL`: account API base URL (default `/account-api`)
- `VITE_CURRENCY`: currency code for displayed amounts (default `INR`)

`VITE_*` values are included in the browser bundle; do not put secrets in them.
For production, serve the frontend and proxy both API paths through the same
origin, or configure each backend with a narrowly scoped CORS allowlist for the
exact frontend origin.

## Features and API coverage

- Register and log in through Identity Service (`/api/v1/auth/register` and
  `/api/v1/auth/login`), and load the signed-in user profile from
  `/api/v1/users/me`.
- Review and filter paginated transactions, add one or multiple transactions,
  edit or delete a transaction, and import CSV files using FinanceFlow's
  transaction endpoints.
- Review monthly category budgets and create, update, or delete budgets.
- View dashboard totals, spending trends, category summaries, and budget
  progress calculated from the user's API data.
- Admins can open the protected Admin area to view the user count, search
  paginated accounts, inspect safe account details, and view a user's
  transactions through the admin-authorized FinanceFlow endpoint.
- Admin user status and role changes are not available because the Identity
  Service does not currently support those operations.

## Session security

The access token is kept in `sessionStorage`, attached to authenticated API
requests, and cleared on logout, expiry, or an unauthorized response. This
limits persistence to the current browser tab session, but browser storage
remains accessible to JavaScript executing on the origin. Use HTTPS in
production and protect the application against cross-site scripting. The
current backend contract has no refresh-token flow.
