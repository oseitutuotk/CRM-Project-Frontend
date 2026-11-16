# MicroPhoenix CRM - Frontend Dashboard

A modern, responsive React frontend designed to demonstrate and interact with the **MicroPhoenix Pension & Scheme CRM** ASP.NET Core Web API.

---

## 🚀 Live Tunnel Connection
Your frontend is pre-configured to proxy API calls directly to your friend's Microsoft Dev Tunnel:
```text
https://vcc4ftq2-7293.uks1.devtunnels.ms
```

### Why the built-in proxy is great:
- **No CORS errors:** Your browser communicates locally with `http://localhost:3000/api`, and Vite securely forwards the requests to your friend's machine.
- **Bypasses Dev Tunnel splash screens:** The proxy automatically sends the `X-Tunnel-Skip-Anti-Abuse-Page` header.
- **Port flexibility:** If you later want to run the backend on your own machine instead, you can click the **API Status** pill in the top navbar and switch back to `http://localhost:5173`.

---

## 🛠️ How to Run the Frontend

In your terminal:
```bash
cd "c:\Users\Osei Tutu Kwabena\Desktop\Work1\MicroPhoenix.Web"
npm run dev
```

Then open your browser to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧭 Dashboard Modules & Features

1. **Dashboard Overview:**
   - Real-time KPI metric cards (Total Members, Schemes, Active Portfolios, Total Pension Assets Managed).
   - Quick Action buttons: Register Member, Enroll in Scheme, Deposit Contribution.
   - Scheme tier distribution (Tier 2 vs Tier 3).

2. **Members (Users) Directory:**
   - Search by name, email, or phone number.
   - Filter by role (Admin vs Member).
   - **Register Member Modal:** Calls `POST /api/users`.
   - **Member Portfolio Drawer:** Inspects any member's enrolled pension schemes and balances via `GET /api/users/{id}/enrollments`.

3. **Pension Schemes & NAV Management:**
   - Grid of all pension schemes with tier badges (Tier 2 Occupational vs Tier 3 Voluntary).
   - **Create Scheme Modal:** Admin action calling `POST /api/schemes`.
   - **NAV History & Daily Pricing:** Inspect historical unit rates and publish daily NAV updates (`POST /api/schemes/{id}/nav`).

4. **Portfolios & Account Ledger:**
   - Master ledger of all scheme enrollments with balances.
   - **Enroll Member Modal:** Links a user to a scheme (`POST /api/enrollments`).
   - **Deposit Contribution:** Add money to a member's scheme balance (`POST /api/enrollments/{id}/contributions`).
   - **Redeem Funds:** Disburse funds with automated balance check (`POST /api/enrollments/{id}/redemptions`).
   - **Ledger Audit Modal:** View timestamped contribution and redemption history for any account.
