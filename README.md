# Insu Broker — Insurance Sales Management System

[![CI](https://github.com/ugthdrpp1-pixel/insu-broker/actions/workflows/ci.yml/badge.svg)](https://github.com/ugthdrpp1-pixel/insu-broker/actions/workflows/ci.yml)

A comprehensive Next.js + Prisma + SQLite insurance sales management system with Thai/English i18n.

## Features

### Core Modules
- 📊 **Dashboard** — KPIs, sales trends, renewal alerts, top agents
- 👥 **Customer CRM** — Full profile with KYC, address, contact, tags
- 📦 **Product & Plan Catalog** — 5 product types with plans & rates
- 🎯 **Lead Pipeline** — Status tracking, follow-up, conversion
- 📝 **Premium Calculator** — Real-time calculation with age/occupation factors
- 📄 **Quote Management** — Generate, send, convert to policy
- 🛡️ **Policy Management** — Beneficiaries, renewal, cancellation
- 🧾 **Claims** — Submit, approve, reject, pay, with evidence upload
- 💰 **Payments** — Premium, commission, claim payout tracking
- 🏆 **Commissions** — Automatic calculation, approval, payment
- 📁 **Document Library** — Secure file storage with categorization
- 📈 **Reports & Analytics** — Sales, claim, agent performance
- 👨‍💼 **User Management** — Role-based access (Admin)
- ⚙️ **Settings** — Company info, locales, currencies
- 📋 **Audit Logs** — All actions tracked

### Product Types Covered
- **Life**: Savings plan 15Y, Term 30Y
- **Health**: Basic, Premium
- **Motor**: Class 1, 2+, 3, Compulsory (พ.ร.บ.)
- **Personal Accident**: Basic, Premium
- **Property**: Home fire, Condo

### Technical Features
- Multi-role authentication (Admin / Manager / Agent / Customer)
- i18n with Thai + English
- Local file storage with security checks
- Audit log for every action
- Notification system
- PDF-ready quote & policy structure
- Comprehensive premium calculator

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and edit it
cp .env.example .env
# Edit .env: set NEXTAUTH_SECRET (e.g. `openssl rand -base64 32`)

# 3. Apply Prisma migrations + generate client
#    (uses prisma/migrations/*.sql tracked in git)
npm run db:migrate

# 4. Seed the database with sample data
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open http://localhost:3000 → redirects to `/th/login`

### Migration commands

| Script              | Use it when...                                       |
|---------------------|------------------------------------------------------|
| `npm run db:migrate`| Developing locally — creates/updates migration files |
| `npm run db:deploy` | Deploying / CI — only applies pending migrations     |
| `npm run db:push`   | Quick prototyping only — **skips migration history** |
| `npm run db:seed`   | Populate sample data after migrations                |
| `npm run db:studio` | Browse data visually                                 |

> Migrations in `prisma/migrations/` are committed to git. The SQLite binary
> (`prisma/dev.db`) is gitignored — each developer gets their own local DB.

### Demo Accounts (Password: `password123`)

| Role | Email |
|------|-------|
| Admin | `admin@insu.co.th` |
| Manager | `manager@insu.co.th` |
| Agent (TH) | `agent@insu.co.th` |
| Agent (TH) | `agent2@insu.co.th` |
| Agent (EN) | `lina@insu.co.th` |

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Prisma ORM + SQLite (file: `prisma/dev.db`)
- NextAuth.js (Auth.js v5)
- next-intl (i18n)
- Tailwind CSS + shadcn-style components
- Recharts for analytics
- bcryptjs for password hashing
- Zod for validation
- Server Actions + Server Components

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes (auth, documents, notifications)
│   ├── [locale]/               # Locale-routed pages
│   │   ├── login/              # Login (public)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── customers/          # CRM module
│   │   ├── products/           # Product & plan management
│   │   ├── leads/              # Sales leads
│   │   ├── quotes/             # Quotes + premium calculator
│   │   ├── policies/           # Active policies
│   │   ├── claims/             # Claims workflow
│   │   ├── commissions/        # Commission tracking
│   │   ├── payments/           # Payment recording
│   │   ├── documents/          # File library
│   │   ├── reports/            # Analytics & reports
│   │   ├── users/              # User management (admin)
│   │   ├── settings/           # System settings (admin/manager)
│   │   └── audit-logs/         # Activity logs (admin)
├── actions/                    # Server actions for each entity
├── components/
│   ├── ui/                     # Reusable UI primitives
│   ├── nav/                    # Sidebar, header, locale switcher
│   └── charts/                 # Recharts wrappers
├── i18n/                       # Thai & English translations
├── lib/                        # DB, auth, utils, premium calculator
└── middleware.ts               # next-intl middleware

prisma/
├── schema.prisma               # Full data model (source of truth)
├── seed.ts                     # Sample data (idempotent, run after migrate)
├── migrations/                 # Generated SQL migrations (TRACKED in git)
│   ├── migration_lock.toml
│   └── <timestamp>_<name>/migration.sql
└── dev.db                      # SQLite binary (gitignored, regenerable)
```

## Locale prefix
All routes are prefixed with `/th` or `/en`. The middleware handles locale detection and redirection.

## Roles & Permissions

| Role | Access |
|------|--------|
| ADMIN | Everything |
| MANAGER | All except user management & audit logs |
| AGENT | All operational modules (no admin) |
| CUSTOMER | Restricted (placeholder for portal) |

## Premium Calculator Logic

Located in `src/lib/premium-calculator.ts`. The calculator applies:
- Base rate by product type
- Age loading (rate cards)
- Gender factor (Male+15%, Female baseline)
- Occupation loading (High risk +30%, Low risk -5%)
- Term adjustment (15Y+ = -15%)
- Frequency adjustment (monthly = +12%)
- Admin fee (4-6%)

## Continuous Integration

A GitHub Actions workflow in `.github/workflows/ci.yml` runs on every push and
pull request. The job installs dependencies, applies Prisma migrations to a
fresh SQLite database, smoke-tests the Prisma client, then runs `typecheck`
and `lint`.

To enable it on your fork, replace `ugthdrpp1-pixel/insu-broker` in the badge URL with your
GitHub namespace.

## License
This is a starter/educational project. Customize freely.
