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

PrintStack is a digital marketplace that connects students with local print shops to streamline the entire printing process — from upload to collection. Students configure their print job, get an instant quote, pay online, and collect their documents securely. Shopkeepers get a real-time dashboard to manage orders, pricing, and daily revenue without any manual overhead.

### Why It Was Built

Traditional document printing is broken in several ways. Manual systems create long queues and unpredictable wait times. Pricing is opaque until you're already at the counter. Transactions are almost entirely cash-based, leaving no digital record for either party. And shop owners have no tools to track orders or manage workflow efficiently. PrintStack was built to solve all of these problems in one platform.

---

## Features

### For Students

| Feature | Description |
|---|---|
| **Smart PDF Uploads** | Automatically detects page counts using `pdf-lib` |
| **Instant Price Quoting** | Calculates the total cost immediately based on selected print settings — no surprises at the counter |
| **Advanced Print Configuration** | Color vs. B&W page ranges, double-sided printing, large formats (A3, A2, A0) |
| **Finishing Options** | Spiral/hard binding, lamination, stapling, transparent covers |
| **Shop Discovery** | Browse and compare nearby print shops with live pricing, distances, and queue estimates |
| **Live Order Tracking** | Real-time progress tracking — Queue → Printing → Ready |
| **Secure Handoff** | 6-digit OTP for verified document collection at the counter |

### For Shop Owners

| Feature | Description |
|---|---|
| **Real-Time POS Dashboard** | Live incoming order feed with status updates — no manual refresh required |
| **Order Status Management** | Move orders through states: Pending → Printing → Ready → Delivered |
| **Dynamic Pricing Matrix** | Control base pricing, double-sided multipliers, format stock limits, and flat fees |
| **Revenue Analytics** | Monitor daily revenue and order throughput at a glance |
| **Storefront Management** | Toggle shop status: Active, Closed, or Paused for a set duration |
| **Secure PDF Access** | Auto-generated, short-lived signed URLs for downloading student documents |
| **Bulk Order Handling** | Built to manage peak loads such as thesis submissions or event print runs |

### For Platform Admins

| Feature | Description |
|---|---|
| **Admin SPA Dashboard** | Single Page Application to monitor the entire platform in real time |
| **Global Ledger** | Track platform-wide revenue and active queues across all shops |
| **Dispute Resolution** | Review refund requests with reasons, track pending refund amounts, and manage open complaints against specific shops |

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
git clone https://github.com/tanmay-mevada/Print-Stack.git
cd Print-Stack
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

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/tanmay-mevada">
        <img src="https://github.com/tanmay-mevada.png" width="72px" style="border-radius:50%"/><br/>
        <sub><b>Tanmay Mevada</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Aum-Ghodasara">
        <img src="https://github.com/Aum-Ghodasara.png" width="72px" style="border-radius:50%"/><br/>
        <sub><b>Aum Ghodasara</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Urvi-Ladhani">
        <img src="https://github.com/Urvi-Ladhani.png" width="72px" style="border-radius:50%"/><br/>
        <sub><b>Urvi Ladhani</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ampatel05">
        <img src="https://github.com/ampatel05.png" width="72px" style="border-radius:50%"/><br/>
        <sub><b>ampatel05</b></sub>
      </a>
    </td>
  </tr>
</table>

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details

---

<div align="center">
<a href="https://github.com/tanmay-mevada/Print-Stack">Give it a star if you find it useful.</a>
</div>
