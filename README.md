# Personal Trainer

An appointment, package and payment management platform for personal trainers (PTs) and their clients.
Trainers manage their working hours, locations, session packages and clients. Clients buy packages and
book sessions from the trainer's public profile page (`/pt/[slug]`), then follow their progress.

## Features

- **Authentication:** Phone-based OTP login, Google sign-in (server-side `id_token` verification), JWT access tokens with rotating refresh tokens
- **Client onboarding:** Trainers add clients directly; the client completes their profile through an invite link (only the token hash is stored)
- **Booking:** Slot generation from working hours, session length, buffer time and travel time between locations. A selected slot is held with a 1-minute Redis lock (backed by a `Locked` row in the database), and slot changes are pushed live over SignalR
- **Cancellation rules:** Clients can cancel up to 12 hours before a session; trainers can cancel and decide whether the session is refunded to the package. Trainers can also close a day and bulk-cancel its remaining appointments
- **Packages:** Session packages, purchase flow and remaining-session tracking
- **Payments:** PayTR integration (iframe + hash-verified webhook) and manual "mark as paid" for cash / bank transfer
- **Notifications:** In-app notifications and a transactional email outbox (MailKit / Gmail SMTP)
- **Client tracking:** Goals, coaching notes, body measurements, reviews and favorite trainers
- **Reports:** Revenue, occupancy and client statistics for the trainer dashboard

## Architecture

```
backend/   .NET 10 Web API (Clean Architecture)
  src/PersonalTrainer.Api             Controllers, middleware, Swagger
  src/PersonalTrainer.Application     DTOs and service interfaces
  src/PersonalTrainer.Domain          Entities and enums
  src/PersonalTrainer.Infrastructure  EF Core (PostgreSQL), Redis, SignalR hub, email, PayTR, auth, background services
web/       Next.js 16 + React 19 + Tailwind CSS 4 (trainer panel, client area, public trainer profile)
mobile/    Flutter trainer app (pt_mobile): dashboard, appointments, packages, onboarding
screens/   Design reference screens
```

| Layer    | Technologies |
|----------|--------------|
| Backend  | ASP.NET Core 10, EF Core 10 + Npgsql, ASP.NET Identity, StackExchange.Redis, SignalR, Serilog, MailKit |
| Web      | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, lucide-react, @microsoft/signalr |
| Mobile   | Flutter (Dart 3.13+), http, flutter_secure_storage, signalr_netcore |
| Infra    | PostgreSQL 16, Redis 7, Docker Compose |

### Background services

| Service | Interval | Purpose |
|---------|----------|---------|
| `LockExpirySweepService` | 30 s | Releases reservation locks that were never confirmed |
| `AppointmentCompletionSweepService` | 5 min | Marks past confirmed appointments as completed |
| `EmailDispatchSweepService` | 5 s (or immediately on signal) | Sends pending messages from the email outbox |

## Getting started

### Requirements

- Docker and Docker Compose
- .NET 10 SDK (to run the API outside Docker)
- Node.js 20+
- Flutter SDK (for the mobile app)

### 1. Backend

```bash
cd backend
cp .env.example .env        # then set JWT_SIGNING_KEY (required); everything else is optional
docker compose up --build
```

`JWT_SIGNING_KEY` must be at least 32 random bytes in base64 (`openssl rand -base64 48`).
Gmail, Google sign-in and PayTR values are optional and can stay empty in development.

This starts PostgreSQL (`localhost:5433`), Redis (`localhost:6379`) and the API (`http://localhost:5190`).
Database migrations are applied automatically on startup in the Development environment.

- Swagger: http://localhost:5190/swagger
- Health checks: http://localhost:5190/health and `/health/ready`

In development, emails are logged instead of sent (`EMAIL_USE_FAKE_SENDER=true`),
and PayTR runs against a fake gateway (`Paytr__UseFakeGateway=true`).

To run the API outside Docker, start only `postgres` and `redis`:

```bash
docker compose up -d postgres redis
dotnet run --project src/PersonalTrainer.Api
```

### 2. Web

```bash
cd web
npm install
npm run dev
```

The app runs at http://localhost:3000. The API URL defaults to `http://localhost:5190`;
override it by copying `web/.env.example` to `web/.env.local`:

```env
BACKEND_API_URL=http://localhost:5190            # server-side requests
NEXT_PUBLIC_API_BASE_URL=http://localhost:5190   # browser requests / SignalR
```

### 3. Mobile

```bash
cd mobile
flutter pub get
flutter run
```

On the Android emulator the API URL defaults to `http://10.0.2.2:5190`. For other targets:

```bash
flutter run --dart-define=API_BASE_URL=http://<your-machine-ip>:5190
```

## Configuration

Backend settings are read from `appsettings*.json` and environment variables. The main ones:

When running with Docker Compose, these are filled from `backend/.env` (see `backend/.env.example`).

| Setting | Description |
|---------|-------------|
| `ConnectionStrings__Default` | PostgreSQL connection |
| `ConnectionStrings__Redis` | Redis connection |
| `Jwt__SigningKey`, `Jwt__Issuer`, `Jwt__Audience` | JWT signing settings |
| `Google__ClientId` | Google sign-in |
| `Email__*` | SMTP settings (via `backend/.env`) |
| `Paytr__*` | PayTR merchant credentials |
| `Cors__AllowedOrigins__0` | Web app origin |

> Values in `docker-compose.yml` are for development only. In production, provide real secrets through
> the deployment environment's variables; `.env` files are not committed.

## Development status

- **OTP:** No SMS provider is integrated yet. In development every phone number accepts the fixed code `123456`.
- **PayTR:** Merchant credentials are placeholders; real purchases need live credentials.
- **Apple sign-in:** The verifier is registered but not implemented yet.
- **Web redesign:** A responsive desktop layout is being rolled out step by step.
