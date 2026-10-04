# CloudNet Monitor

CloudNet Monitor is a Computer Networks mini-project: a cloud-based network monitoring and traffic analysis application built with React, Express, MongoDB, and an optional Python client agent.

This repository is currently at **Phase 12** of the build plan:

- Project structure is in place.
- React + Vite + Tailwind CSS frontend is configured.
- Express backend is configured.
- MongoDB connection settings are environment-driven.
- Python agent folder and environment contract are prepared for later phases.
- User persistence is modeled in MongoDB.
- JWT authentication routes are implemented.
- Passwords are hashed with bcrypt.
- The frontend login/register screen calls the backend API.
- Device, metric, alert, and settings models are implemented with MongoDB indexes.
- REST API routes are implemented for dashboard, devices, metrics, alerts, topology, settings, and agent ingestion.
- The authenticated dashboard UI is implemented with summary cards, charts, recent alerts, activity, and device health.
- Devices and Device Details views are implemented with search, status filtering, metric tables, and historical charts.
- Network Analytics is implemented with time-window filters, device filtering, bandwidth, latency, packet statistics, and packet-loss charts.
- Alerts UI is implemented with severity/type/read filters plus mark-read and resolve actions.
- Network Topology UI is implemented with React Flow using registered/known devices from the backend.
- Demo Mode is implemented with backend demo seeding, simulation APIs, and a frontend Demo Mode control page.
- Optional Python CloudNet Agent is implemented for real heartbeat and metric submission.
- Phase 12 testing and bug-fix pass is complete with frontend lint/build, backend syntax checks, and dependency audit passing.
- Browser Mode and Target Analyzer are implemented for browser-level diagnostics and safe public target analysis.

## Architecture

Browser -> React frontend -> REST API -> Express backend -> MongoDB

Optional real monitoring path:

Client computer -> CloudNet Python agent -> REST API -> Express backend -> MongoDB -> dashboard

## Folder Structure

```text
cloudnet-monitor/
  frontend/
  backend/
  agent/
  README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB for local development, or MongoDB Atlas for a cloud database
- Python 3.10 or newer for the future CloudNet Agent

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp agent/.env.example agent/.env
```

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

The app opens at:

- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://localhost:4000/api/health`

## Environment Variables

Backend:

- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`

Frontend:

- `VITE_API_BASE_URL`

Agent:

- `CLOUDNET_API_URL`
- `CLOUDNET_AGENT_TOKEN`

## MongoDB Compass

MongoDB Compass is a database GUI client, not the database itself. For local development, run MongoDB locally or use MongoDB Atlas, then connect Compass to that MongoDB URI to inspect collections.

Authentication requires a live MongoDB connection. If `MONGODB_URI` is missing or MongoDB is not running, `/api/auth/register` and `/api/auth/login` return `DATABASE_UNAVAILABLE` instead of using fake frontend credentials.

## Authentication API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Login and registration return a JWT access token plus the safe user profile. Protected routes expect:

```http
Authorization: Bearer <token>
```

## API Overview

Browser/client routes require a JWT bearer token:

- `GET /api/dashboard/summary`
- `GET /api/devices`
- `GET /api/devices/:id`
- `GET /api/metrics`
- `GET /api/alerts`
- `PATCH /api/alerts/:id`
- `GET /api/topology`
- `GET /api/settings`
- `PATCH /api/settings`

Agent routes use secure agent credentials:

- `POST /api/agents/register`: admin JWT required; returns a one-time agent token.
- `POST /api/agents/heartbeat`: agent token required through `x-agent-token` or `Authorization: Bearer <token>`.
- `POST /api/metrics`: agent token required; stores metric data, updates device health, and evaluates threshold alerts.

If `AGENT_REGISTRATION_TOKEN` is configured, agent registration also requires:

```http
x-agent-registration-token: <token>
```

## Dashboard

The authenticated dashboard loads from `GET /api/dashboard/summary` and displays:

- Total, online, offline, and degraded device counts.
- Average latency, upload traffic, download traffic, and packet loss.
- Network traffic, upload/download, latency, and packet-loss charts.
- Recent alerts.
- Recent device activity.
- Device health distribution.

The dashboard does not fabricate measurements. If MongoDB has no devices or metrics yet, it shows empty states. Demo data will be introduced later in the dedicated Demo Mode phase.

## Devices

The authenticated Devices view loads from `GET /api/devices` and supports:

- Search by name, hostname, IP address, or operating system.
- Status filtering for online, degraded, and offline devices.
- Device rows with name, hostname, IP address, OS, status, last seen, latency, upload/download traffic, packets sent/received, and packet loss.
- Click-through into a Device Details view.

The Device Details view loads from `GET /api/devices/:id` and displays:

- Device name, hostname, IP address, operating system, status, source, and last seen.
- Current latency, upload, download, packet counts, and packet loss.
- Historical latency, traffic, and packet charts using backend metric samples.

## Browser Mode / My Device

The authenticated My Device view analyzes the browser and connection currently using the dashboard.

It uses browser APIs for:

- User agent and platform information.
- Language and timezone.
- Screen size and device pixel ratio.
- Online/offline status.
- Browser Network Information API estimates where supported.
- A local browser session ID stored in localStorage.

It also measures Browser -> Cloud API round-trip time with `GET /api/network/ping` using `performance.now()`.

Limitations:

- Browser Mode cannot read operating-system packet counters.
- Browser Mode cannot discover all LAN devices.
- Browser Mode does not create MongoDB device records.
- Browser Mode is not the same as Agent Mode.

## Target Analyzer

The authenticated Target Analyzer view uses `POST /api/network/analyze`.

Supported targets:

- Public DNS hostnames.
- Public IPv4 addresses.
- Public IPv6 addresses.
- HTTP and HTTPS URLs.

It reports:

- DNS resolution.
- Public IPv4/IPv6 addresses.
- HTTP/HTTPS reachability.
- HTTP status.
- Response time.
- Final URL after safe redirects.
- Safe server header, if present.

Security restrictions:

- Rejects localhost and private/local IP ranges.
- Rejects cloud metadata addresses such as `169.254.169.254`.
- Rejects arbitrary protocols such as `file://` and `ftp://`.
- Rejects custom ports.
- Validates DNS results and redirect destinations.
- Limits timeout and response size.
- Does not perform port scanning, vulnerability scanning, or unrestricted network discovery.

Private/local addresses cannot be analyzed from the cloud backend. Use CloudNet Agent Mode for devices inside a local network.

## Network Analytics

The authenticated Analytics view loads from `GET /api/metrics` and `GET /api/devices` and supports:

- Last 15 minutes, last hour, last 24 hours, and last 7 days filters.
- Optional device filtering.
- Bandwidth chart.
- Upload/download comparison.
- Latency chart.
- Packet statistics chart.
- Packet loss chart.

Analytics uses backend metric data only. Demo data will be introduced later in the dedicated Demo Mode phase.

## Alerts

The authenticated Alerts view loads from `GET /api/alerts` and supports:

- Severity filtering for info, warning, and critical alerts.
- Alert type filtering for high latency, packet loss, device offline, and high traffic.
- Read/unread filtering.
- Mark read action through `PATCH /api/alerts/:id`.
- Resolve action through `PATCH /api/alerts/:id`.

## Network Topology

The authenticated Topology view loads from `GET /api/topology` and shows:

- Internet / Cloud node.
- Network / Router node.
- Registered device nodes.
- Status-colored device nodes.
- Click-to-inspect node details.

The topology is a monitoring visualization based on known registered devices. It does not claim automatic physical network discovery.

## Demo Mode

Demo Mode works without physical monitoring hardware and stores clearly labeled simulated records using `source: demo`.

Frontend controls:

- Seed Demo Data.
- Simulate high latency.
- Simulate packet loss.
- Simulate high traffic.
- Simulate device offline.
- Simulate device online.

Backend APIs:

- `POST /api/demo/seed`
- `POST /api/demo/simulate`

Demo data appears throughout Dashboard, Devices, Device Details, Analytics, Alerts, and Topology because it is stored in MongoDB through the same backend models as real agent data.

## Python Agent

The optional Python agent lives in `agent/cloudnet_agent`.

Commands:

```bash
python -m agent.cloudnet_agent register
python -m agent.cloudnet_agent heartbeat
python -m agent.cloudnet_agent once
python -m agent.cloudnet_agent run
```

It uses:

- `CLOUDNET_API_URL`
- `CLOUDNET_AGENT_TOKEN`
- `CLOUDNET_ADMIN_JWT` for registration only
- `CLOUDNET_AGENT_INTERVAL_SECONDS`

The agent uses optional `psutil` if installed. Without it, traffic and packet counters are zero instead of fabricated.

## Mode Differences

- Browser Mode: analyzes the current browser/device connection using browser APIs and Cloud API round-trip tests.
- Agent Mode: provides deeper operating-system/network-interface monitoring through the optional Python agent.
- Target Analyzer: performs limited application-level checks of public targets from the Render backend.

## Deployment Readiness

Frontend deployment target: Vercel.

- Frontend app root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required frontend environment variable: `VITE_API_BASE_URL`

Backend deployment target: Render.

- Backend app root: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Required backend environment variables: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`
- Optional backend environment variable: `AGENT_REGISTRATION_TOKEN`

Deployment helper files:

- `frontend/vercel.json`
- `render.yaml`
- `DEPLOYMENT.md`

## Database Collections

Phase 3 defines these MongoDB collections:

- `users`: authenticated CloudNet users with bcrypt password hashes.
- `devices`: monitored devices with hostname, IP address, OS, status, last seen time, and latest network metrics.
- `metrics`: time-series network measurements with indexes for `deviceId` and `timestamp`.
- `alerts`: high latency, packet loss, device offline, and high traffic alerts with read/resolved state.
- `settings`: global thresholds for latency, packet loss, traffic, offline timeout, refresh interval, theme, and demo mode.

Important indexes are defined for fast dashboard and analytics queries, especially `deviceId + timestamp` on metrics.

## Current Phase Verification

- Backend exposes `GET /api/health`.
- Frontend calls the backend health endpoint and displays API/database status.
- Frontend provides validated login and registration forms.
- Backend validates auth payloads with Zod.
- Backend protects `/api/auth/me` with JWT middleware.
- Backend defines Mongoose models for devices, metrics, alerts, and settings.
- Backend exposes the Phase 4 REST API with consistent JSON responses.
- Frontend renders the Phase 5 dashboard after JWT session verification.
- Frontend renders Phase 6 Devices and Device Details views from backend device APIs.
- Frontend renders Phase 7 Network Analytics from backend metrics APIs.
- Frontend renders Phase 8 Alerts from backend alert APIs.
- Frontend renders Phase 9 Network Topology from backend topology APIs.
- Frontend and backend support Phase 10 Demo Mode without requiring physical hardware.
- Python agent supports Phase 11 registration, heartbeat, and metric submission.
- Phase 12 checks pass: frontend lint, frontend production build, backend syntax, and npm audit.

Later phases will add deployment execution and full academic documentation.
