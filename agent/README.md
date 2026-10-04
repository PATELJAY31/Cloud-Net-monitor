# CloudNet Agent

Python endpoint agent for CloudNet Monitor.

The agent registers the current machine, sends heartbeat events, and submits real operating-system/network measurements to the existing CloudNet backend. Real monitoring uses `psutil`; install dependencies before running the agent.

## Setup

From the repository root:

```powershell
cd agent
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..
```

Configure `agent/.env`:

- `CLOUDNET_API_URL`
- `CLOUDNET_AGENT_TOKEN`
- `CLOUDNET_ADMIN_JWT`
- `CLOUDNET_AGENT_REGISTRATION_TOKEN`
- `CLOUDNET_AGENT_INTERVAL_SECONDS`
- `CLOUDNET_PROBE_HOST`

Do not store real credentials in documentation or commit `agent/.env`.

## Run

From the repository root:

```powershell
python -m agent.cloudnet_agent register
```

Save the returned token into `CLOUDNET_AGENT_TOKEN`, then run:

```powershell
python -m agent.cloudnet_agent heartbeat
python -m agent.cloudnet_agent once
python -m agent.cloudnet_agent run
```

`register` submits the machine's real hostname, local IP, operating system, and network interfaces. `once` and `run` sample real network counters over `CLOUDNET_AGENT_INTERVAL_SECONDS`, probe `CLOUDNET_PROBE_HOST`, and submit upload Mbps, download Mbps, packet counts, packet loss, latency, and jitter.

Demo Mode is separate from the agent path. Demo records use `source: demo`; real agent submissions use `source: agent`.
