# Creative Kids Academy — Daycare Management Platform

A full-stack monorepo for managing daycare operations including enrollment, attendance, billing, messaging, and daily reporting.

## Structure

```
daycare-monorepo/
├── apps/
│   ├── web/          # Next.js 14 frontend (TypeScript, Tailwind CSS)
│   └── api/          # NestJS backend (TypeScript, Prisma, PostgreSQL)
└── package.json      # Monorepo root
```

## Tech Stack

**Frontend** (`apps/web`)
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- TanStack Query
- Zustand
- Stripe.js
- Recharts
- Framer Motion

**Backend** (`apps/api`)
- NestJS 11
- Prisma ORM (PostgreSQL)
- JWT Authentication + Passport
- Stripe (payments)
- Twilio (SMS)
- Resend (email)
- AWS S3 (file storage)
- PDF generation

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL database

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
4. Run database migrations:
   ```bash
   cd apps/api && npx prisma migrate dev
   ```
5. Start development servers:
   ```bash
   npm run dev:web     # http://localhost:3000
   npm run dev:api     # http://localhost:4000
   ```

## Database Schema

24 Prisma models covering:
- **Auth**: User, Role (enum)
- **Profiles**: ParentProfile, StaffProfile
- **Students**: Student, StudentParent, EmergencyContact, AuthorizedPickup
- **Operations**: Classroom, Registration, Document
- **Messaging**: MessageThread, Message
- **Notifications**: Notification, SmsLog
- **Billing**: FeeType, Invoice, InvoiceItem, Payment, Receipt
- **Attendance**: Attendance, DailyReport, IncidentLog
- **Audit**: ActivityLog