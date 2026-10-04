import ipaddress
import platform
import re
import socket
import subprocess
import time

import psutil


PING_COUNT = 4
PING_TIMEOUT_SECONDS = 3


def collect_device_info(_api_url: str) -> dict:
    hostname = socket.gethostname()
    interfaces = get_network_interfaces()
    local_ip = choose_local_ip(interfaces)

    return {
        "name": hostname,
        "hostname": hostname,
        "ipAddress": local_ip,
        "operatingSystem": f"{platform.system()} {platform.release()}",
        "networkInterfaces": interfaces,
    }


def collect_metric(interval_seconds: int, probe_host: str) -> dict:
    before = psutil.net_io_counters()
    sample_seconds = max(1, interval_seconds)
    time.sleep(sample_seconds)
    after = psutil.net_io_counters()

    upload_mbps = ((after.bytes_sent - before.bytes_sent) * 8) / sample_seconds / 1_000_000
    download_mbps = ((after.bytes_recv - before.bytes_recv) * 8) / sample_seconds / 1_000_000
    quality = measure_network_quality(probe_host)

    return {
        "latencyMs": quality["latencyMs"],
        "uploadMbps": round(upload_mbps, 4),
        "downloadMbps": round(download_mbps, 4),
        "packetsSent": max(0, after.packets_sent - before.packets_sent),
        "packetsReceived": max(0, after.packets_recv - before.packets_recv),
        "packetLossPercent": quality["packetLossPercent"],
        "jitterMs": quality["jitterMs"],
        "intervalSeconds": sample_seconds,
    }


def get_network_interfaces() -> list[dict]:
    interfaces = []
    stats = psutil.net_if_stats()

    for name, addresses in psutil.net_if_addrs().items():
        if name in stats and not stats[name].isup:
            continue

        mac_address = None
        ip_addresses = []

        for address in addresses:
            if address.family == socket.AF_INET:
                ip = ipaddress.ip_address(address.address)
                if not ip.is_loopback and not ip.is_link_local:
                    ip_addresses.append({"ipAddress": str(ip), "family": "IPv4"})
            elif address.family == socket.AF_INET6:
                raw_ip = address.address.split("%")[0]
                ip = ipaddress.ip_address(raw_ip)
                if not ip.is_loopback and not ip.is_link_local:
                    ip_addresses.append({"ipAddress": str(ip), "family": "IPv6"})
            elif address.family == getattr(psutil, "AF_LINK", object()):
                mac_address = address.address or mac_address

        for item in ip_addresses:
            interfaces.append(
                {
                    "name": name,
                    "ipAddress": item["ipAddress"],
                    "family": item["family"],
                    "macAddress": mac_address,
                }
            )

    return interfaces


def choose_local_ip(interfaces: list[dict]) -> str:
    for interface in interfaces:
        if interface["family"] == "IPv4":
            return interface["ipAddress"]
    for interface in interfaces:
        return interface["ipAddress"]
    raise RuntimeError("No usable local network interface address was found.")


def measure_network_quality(probe_host: str) -> dict:
    command = build_ping_command(probe_host)
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=PING_COUNT * (PING_TIMEOUT_SECONDS + 1))
    except subprocess.TimeoutExpired:
        return {
            "latencyMs": 0,
            "packetLossPercent": 100,
            "jitterMs": 0,
        }
    except OSError as error:
        raise RuntimeError("Native ping command was not available for network-quality measurement.") from error

    output = f"{completed.stdout}\n{completed.stderr}"
    latencies = [float(value) for value in re.findall(r"time[=<]\s*(\d+(?:\.\d+)?)\s*ms", output, flags=re.I)]
    received = len(latencies)

    if not latencies:
        return {
            "latencyMs": 0,
            "packetLossPercent": 100,
            "jitterMs": 0,
        }

    jitter = 0
    if len(latencies) > 1:
        diffs = [abs(latencies[index] - latencies[index - 1]) for index in range(1, len(latencies))]
        jitter = sum(diffs) / len(diffs)

    return {
        "latencyMs": round(sum(latencies) / len(latencies), 2),
        "packetLossPercent": round(((PING_COUNT - received) / PING_COUNT) * 100, 2),
        "jitterMs": round(jitter, 2),
    }


def build_ping_command(probe_host: str) -> list[str]:
    system_name = platform.system().lower()
    if system_name == "windows":
        return ["ping", "-n", str(PING_COUNT), "-w", str(PING_TIMEOUT_SECONDS * 1000), probe_host]
    if system_name == "darwin":
        return ["ping", "-c", str(PING_COUNT), "-W", str(PING_TIMEOUT_SECONDS * 1000), probe_host]
    return ["ping", "-c", str(PING_COUNT), "-W", str(PING_TIMEOUT_SECONDS), probe_host]
