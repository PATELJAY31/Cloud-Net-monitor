import json
import urllib.error
import urllib.request


class CloudNetApiError(RuntimeError):
    pass


class CloudNetClient:
    def __init__(self, api_url: str, agent_token: str = "", admin_jwt: str = "", agent_registration_token: str = ""):
        self.api_url = api_url
        self.agent_token = agent_token
        self.admin_jwt = admin_jwt
        self.agent_registration_token = agent_registration_token

    def register(self, payload: dict) -> dict:
        if not self.admin_jwt:
            raise CloudNetApiError("CLOUDNET_ADMIN_JWT is required for agent registration.")
        headers = {}
        if self.agent_registration_token:
            headers["x-agent-registration-token"] = self.agent_registration_token
        return self._request("/agents/register", payload, bearer=self.admin_jwt, extra_headers=headers)

    def heartbeat(self, payload: dict) -> dict:
        return self._request("/agents/heartbeat", payload, agent_token=True)

    def submit_metric(self, payload: dict) -> dict:
        return self._request("/metrics", payload, agent_token=True)

    def _request(
        self,
        path: str,
        payload: dict,
        bearer: str = "",
        agent_token: bool = False,
        extra_headers: dict | None = None,
    ) -> dict:
        headers = {"Content-Type": "application/json"}
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
        if agent_token:
            if not self.agent_token:
                raise CloudNetApiError("CLOUDNET_AGENT_TOKEN is required.")
            headers["x-agent-token"] = self.agent_token
        headers.update(extra_headers or {})

        request = urllib.request.Request(
            f"{self.api_url}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            raise CloudNetApiError(f"HTTP {error.code}: {body}") from error
        except urllib.error.URLError as error:
            raise CloudNetApiError(f"Connection failed: {error.reason}") from error
