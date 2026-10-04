# CloudNet Agent

Optional Python client agent for CloudNet Monitor.

It can:

- Register a client machine with the backend.
- Send heartbeat events.
- Submit latency and network metric samples.
- Use optional `psutil` for traffic and packet counters when installed.

## Setup

Create `agent/.env` from `.env.example`, then set:

- `CLOUDNET_API_URL`
- `CLOUDNET_AGENT_TOKEN`
- `CLOUDNET_AGENT_INTERVAL_SECONDS`

For first-time registration, also set:

- `CLOUDNET_ADMIN_JWT`
- `CLOUDNET_AGENT_REGISTRATION_TOKEN` if the backend has `AGENT_REGISTRATION_TOKEN` configured

## Run

From the repository root:

```bash
python -m agent.cloudnet_agent register
python -m agent.cloudnet_agent heartbeat
python -m agent.cloudnet_agent once
python -m agent.cloudnet_agent run
```

If `psutil` is unavailable, the agent still sends latency and heartbeat data, while OS-level byte/packet counters are reported as zero rather than fabricated.
