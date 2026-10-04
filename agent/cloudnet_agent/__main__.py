import argparse
import sys

from .client import CloudNetApiError, CloudNetClient
from .config import load_config

try:
    from .collector import collect_device_info, collect_metric
except ModuleNotFoundError as error:
    if error.name == "psutil":
        print("psutil is required for real monitoring. Run: pip install -r agent/requirements.txt", file=sys.stderr)
        raise SystemExit(1) from error
    raise


def main() -> int:
    parser = argparse.ArgumentParser(description="CloudNet Monitor Python Agent")
    parser.add_argument("command", choices=["register", "heartbeat", "once", "run"])
    args = parser.parse_args()

    config = load_config()
    client = CloudNetClient(
        config.api_url,
        config.agent_token,
        config.admin_jwt,
        config.agent_registration_token,
    )

    try:
        if args.command == "register":
            result = client.register(collect_device_info(config.api_url))
            print("Agent registered.")
            print(f"Device: {result['data']['device']['name']}")
            print(f"Token: {result['data']['token']}")
            return 0

        if args.command == "heartbeat":
            result = client.heartbeat({"status": "online"})
            print(result["data"]["heartbeatAt"])
            return 0

        if args.command == "once":
            client.heartbeat({"status": "online"})
            result = client.submit_metric(collect_metric(config.interval_seconds, config.probe_host))
            print(f"Metric submitted for {result['data']['device']['name']}")
            return 0

        while True:
            client.heartbeat({"status": "online"})
            result = client.submit_metric(collect_metric(config.interval_seconds, config.probe_host))
            print(f"Metric submitted for {result['data']['device']['name']}")
    except CloudNetApiError as error:
        print(error, file=sys.stderr)
        return 1
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Agent stopped.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
