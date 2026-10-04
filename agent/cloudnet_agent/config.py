import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AgentConfig:
    api_url: str
    agent_token: str
    admin_jwt: str
    agent_registration_token: str
    interval_seconds: int


def load_config() -> AgentConfig:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")

    return AgentConfig(
        api_url=os.getenv("CLOUDNET_API_URL", "http://localhost:4000/api").rstrip("/"),
        agent_token=os.getenv("CLOUDNET_AGENT_TOKEN", ""),
        admin_jwt=os.getenv("CLOUDNET_ADMIN_JWT", ""),
        agent_registration_token=os.getenv("CLOUDNET_AGENT_REGISTRATION_TOKEN", ""),
        interval_seconds=int(os.getenv("CLOUDNET_AGENT_INTERVAL_SECONDS", "60")),
    )


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
