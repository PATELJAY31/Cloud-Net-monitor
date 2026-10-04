const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

function buildQuery(params) {
  const query = new window.URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? `Backend returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = body?.error?.code;
    error.details = body?.error?.details;
    throw error;
  }

  return response.json();
}

export async function getHealth() {
  return apiRequest('/health');
}

export async function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(account) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(account),
  });
}

export async function getCurrentUser(token) {
  return apiRequest('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getDashboardSummary(token) {
  return apiRequest('/dashboard/summary', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getDevices(token, filters = {}) {
  return apiRequest(`/devices${buildQuery(filters)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getDeviceDetails(token, deviceId) {
  return apiRequest(`/devices/${deviceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMetrics(token, filters = {}) {
  return apiRequest(`/metrics${buildQuery(filters)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAlerts(token, filters = {}) {
  return apiRequest(`/alerts${buildQuery(filters)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAlert(token, alertId, patch) {
  return apiRequest(`/alerts/${alertId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
}

export async function getTopology(token) {
  return apiRequest('/topology', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function seedDemoData(token) {
  return apiRequest('/demo/seed', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function simulateDemoScenario(token, scenario) {
  return apiRequest('/demo/simulate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ scenario }),
  });
}

export async function getNetworkPing() {
  return apiRequest('/network/ping');
}

export async function analyzeNetworkTarget(token, target) {
  return apiRequest('/network/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target }),
  });
}
