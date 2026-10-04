import platform
import socket
import time
import urllib.parse


def collect_device_info(api_url: str) -> dict:
    return {
        "name": socket.gethostname(),
        "hostname": socket.gethostname(),
        "ipAddress": get_local_ip(api_url),
        "operatingSystem": f"{platform.system()} {platform.release()}",
        "networkInterfaces": [
            {
                "name": "primary",
                "ipAddress": get_local_ip(api_url),
                "family": "IPv4",
            }
        ],
    }


def collect_metric(api_url: str, interval_seconds: int) -> dict:
    upload_mbps, download_mbps, packets_sent, packets_received = get_network_counters(interval_seconds)
    latency_ms = measure_latency_ms(api_url)

    return {
        "latencyMs": latency_ms,
        "uploadMbps": upload_mbps,
        "downloadMbps": download_mbps,
        "packetsSent": packets_sent,
        "packetsReceived": packets_received,
        "packetLossPercent": 0,
        "jitterMs": 0,
        "intervalSeconds": interval_seconds,
    }


def get_local_ip(api_url: str) -> str:
    parsed = urllib.parse.urlparse(api_url)
    host = parsed.hostname or "8.8.8.8"
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect((host, parsed.port or 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def measure_latency_ms(api_url: str) -> float:
    parsed = urllib.parse.urlparse(api_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    started = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=5):
            return round((time.perf_counter() - started) * 1000, 2)
    except OSError:
        return 0


def get_network_counters(interval_seconds: int) -> tuple[float, float, int, int]:
    try:
        import psutil  # type: ignore
    except ImportError:
        return 0, 0, 0, 0

    before = psutil.net_io_counters()
    time.sleep(max(1, min(interval_seconds, 5)))
    after = psutil.net_io_counters()
    seconds = max(1, min(interval_seconds, 5))

    upload_mbps = ((after.bytes_sent - before.bytes_sent) * 8) / seconds / 1_000_000
    download_mbps = ((after.bytes_recv - before.bytes_recv) * 8) / seconds / 1_000_000

    return (
        round(upload_mbps, 4),
        round(download_mbps, 4),
        max(0, after.packets_sent - before.packets_sent),
        max(0, after.packets_recv - before.packets_recv),
    )
