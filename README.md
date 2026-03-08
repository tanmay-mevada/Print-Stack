<div align="center">

<img src="public/pblackx.png" alt="PrintStack Logo" width="120"/>

# PrintStack

**The document printing marketplace for students and local print shops.**

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Security](#security--architecture) · [Contributing](#contributing)

</div>

---

## About

PrintStack eliminates the friction between students and print shops. Students upload PDFs, configure print settings, select a nearby shop on an interactive map, and pay instantly. Shopkeepers receive a live order queue and hand off documents securely via OTP verification — no queues, no miscommunication, no lost jobs.

---

## Features

### For Students

| Feature | Description |
|---|---|
| **Smart PDF Uploads** | Automatically detects page counts using `pdf-lib` |
| **Advanced Print Configuration** | Color vs. B&W page ranges, double-sided printing, large formats (A3, A2, A0) |
| **Finishing Options** | Spiral/hard binding, lamination, stapling, transparent covers |
| **Location-Based Routing** | Interactive map with nearby shops, distances, and live queue estimates |
| **Live Order Tracking** | Real-time progress tracking — Queue → Printing → Ready |
| **Secure Handoff** | 6-digit OTP for verified document collection at the counter |

### For Shop Owners

| Feature | Description |
|---|---|
| **Real-Time POS Dashboard** | Live incoming order feed — no manual refresh required |
| **Dynamic Pricing Matrix** | Control base pricing, double-sided multipliers, format stock limits, and flat fees |
| **Storefront Management** | Toggle shop status: Active, Closed, or Paused for a set duration |
| **Secure PDF Access** | Auto-generated, short-lived signed URLs for downloading student documents |

### For Platform Admins

| Feature | Description |
|---|---|
| **Admin SPA Dashboard** | Single Page Application to monitor the entire platform in real time |
| **Global Ledger** | Track platform-wide revenue and active queues |
| **Dispute Resolution** | Manage student complaints and process monetary refunds dynamically |

---

## Tech Stack

```
Frontend      Next.js 14 (App Router) + TypeScript
Styling       Tailwind CSS + Lucide Icons
Database      Supabase — PostgreSQL + Realtime Subscriptions
Auth          Supabase Auth with Row Level Security
Storage       Supabase Storage (Signed URLs)
Payments      PhonePe (Server-to-Server Webhook Integration)
Email         Nodemailer
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm, pnpm, or yarn
- A [Supabase](https://supabase.com/) account and project
- A PhonePe Merchant account (or sandbox credentials)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/printstack.git
cd printstack
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# PhonePe
PHONEPE_ENV=PREPROD
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1

# Email (Nodemailer)
EMAIL_USER=your_platform_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

> Set `PHONEPE_ENV=PROD` when deploying to production.

**4. Initialize the database**

Open your Supabase project's SQL Editor and run the master schema script:

```
/database/schema.sql
```

This creates all required tables, RLS policies, and triggers.

**5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Security & Architecture

Security is a first-class concern throughout PrintStack, not an afterthought.

**Row Level Security (RLS)**
Supabase RLS policies strictly scope data access — students can only see their own orders, and shopkeepers can only access documents routed to their specific shop.

**Server-to-Server Webhooks**
PhonePe payments are verified asynchronously via signed server-to-server webhooks, preventing any frontend manipulation or payment drop-offs.

**Temporary Storage Links**
Student PDFs are stored privately and served only as short-lived signed URLs to authorized shopkeepers. Unauthorized access is structurally impossible.

---

## Contributing

Contributions are welcome and greatly appreciated. To get started:

```bash
# 1. Fork the repository and create your branch
git checkout -b feature/your-feature-name

# 2. Commit your changes with a clear message
git commit -m "feat: describe your change"

# 3. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please ensure your PR follows the existing code style, includes meaningful commit messages, and has been tested locally before submission.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
Built for students and shopkeepers. &nbsp;·&nbsp; <a href="https://github.com/yourusername/printstack">Give it a star if you find it useful.</a>
</div>
