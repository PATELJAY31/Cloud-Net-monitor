import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Cloud,
  Database,
  Gauge,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  Monitor,
  Network,
  Router,
  Settings,
  FlaskConical,
  ShieldCheck,
  Signal,
  WifiOff,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsPage } from './Analytics.jsx';
import { AlertsPage } from './Alerts.jsx';
import { DeviceDetailsPage } from './DeviceDetails.jsx';
import { DevicesPage } from './Devices.jsx';
import { TopologyPage } from './Topology.jsx';
import { DemoModePage } from './DemoMode.jsx';
import { getDashboardSummary } from '../services/api.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'devices', label: 'Devices', icon: Monitor },
  { id: 'analytics', label: 'Analytics', icon: LineChartIcon },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'topology', label: 'Topology', icon: Network },
  { id: 'demo', label: 'Demo Mode', icon: FlaskConical },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statusTone = {
  healthy: 'border-green-200 bg-green-50 text-cloudnet-green',
  degraded: 'border-amber-200 bg-amber-50 text-cloudnet-amber',
  attention_required: 'border-red-200 bg-red-50 text-cloudnet-red',
  empty: 'border-slate-200 bg-slate-50 text-slate-600',
};

export function Dashboard({ onLogout, token, user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  function openDevices() {
    setSelectedDeviceId('');
    setActiveView('devices');
  }

  function openDeviceDetails(deviceId) {
    setSelectedDeviceId(deviceId);
    setActiveView('deviceDetails');
  }

  return (
    <div className="grid min-h-screen bg-slate-50 text-cloudnet-ink lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-cloudnet-line bg-white px-5 py-5 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-cloudnet-blue text-white shadow-sm">
            <Activity aria-hidden="true" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cloudnet-cyan">CloudNet</p>
            <h1 className="text-lg font-bold">Monitor</h1>
          </div>
        </div>

        <nav className="mt-7 grid gap-1">
          {navItems.map((item) => {
            const active = item.id === activeView || (item.id === 'devices' && activeView === 'deviceDetails');

            return (
              <button
                key={item.id}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                  active ? 'bg-blue-50 text-cloudnet-blue' : 'text-slate-600 hover:bg-slate-50 hover:text-cloudnet-ink'
                }`}
                onClick={() => {
                  if (item.id === 'devices') {
                    openDevices();
                  } else {
                    setSelectedDeviceId('');
                    setActiveView(item.id);
                  }
                }}
                type="button"
              >
                <item.icon aria-hidden="true" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-lg border border-cloudnet-line bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in</p>
          <p className="mt-2 truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </aside>

      <section className="min-w-0 px-5 py-5 md:px-7">
        {activeView === 'dashboard' && <DashboardOverview onLogout={onLogout} token={token} />}
        {activeView === 'devices' && (
          <DevicesPage onLogout={onLogout} onSelectDevice={openDeviceDetails} token={token} />
        )}
        {activeView === 'deviceDetails' && (
          <DeviceDetailsPage deviceId={selectedDeviceId} onBack={openDevices} onLogout={onLogout} token={token} />
        )}
        {activeView === 'analytics' && <AnalyticsPage onLogout={onLogout} token={token} />}
        {activeView === 'alerts' && <AlertsPage onLogout={onLogout} token={token} />}
        {activeView === 'topology' && <TopologyPage onLogout={onLogout} token={token} />}
        {activeView === 'demo' && <DemoModePage onLogout={onLogout} token={token} />}
        {['settings'].includes(activeView) && (
          <ComingSoonView onLogout={onLogout} title={navItems.find((item) => item.id === activeView)?.label} />
        )}
      </section>
    </div>
  );
}

function DashboardOverview({ onLogout, token }) {
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    getDashboardSummary(token)
      .then((result) => {
        if (isMounted) {
          setDashboard(result.data);
          setError('');
          setStatus('ready');
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message);
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const metrics = useMemo(
    () =>
      (dashboard?.recentMetrics ?? []).map((metric) => ({
        ...metric,
        time: formatTime(metric.timestamp),
      })),
    [dashboard],
  );

  const summary = dashboard?.summary ?? {};
  const hasMetrics = metrics.length > 0;
  const hasDevices = (dashboard?.recentDevices ?? []).length > 0;
  const hasAlerts = (dashboard?.recentAlerts ?? []).length > 0;

  return (
    <>
      <PageHeader
        badge="Phase 6"
        description="Live health, traffic, latency, packet, and alert data from the CloudNet API."
        onLogout={onLogout}
        title="Network Dashboard"
      >
        {dashboard?.networkStatus && (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              statusTone[dashboard.networkStatus] ?? statusTone.empty
            }`}
          >
            {dashboard.networkStatus.replace('_', ' ')}
          </span>
        )}
      </PageHeader>

      {status === 'loading' && <PageLoading message="Loading dashboard data" />}
      {status === 'error' && <PageError message={error} title="Dashboard data is unavailable" />}
      {status === 'ready' && (
        <div className="py-6">
          <SummaryGrid summary={summary} />

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <ChartPanel
              empty={!hasMetrics}
              title="Network Traffic"
              subtitle="Upload and download throughput over recent metric samples"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={metrics}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area dataKey="downloadMbps" name="Download Mbps" stroke="#2563eb" fill="#bfdbfe" />
                  <Area dataKey="uploadMbps" name="Upload Mbps" stroke="#0891b2" fill="#bae6fd" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel empty={!hasMetrics} title="Upload vs Download" subtitle="Recent bandwidth comparison">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={metrics.slice(-12)}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="uploadMbps" name="Upload Mbps" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downloadMbps" name="Download Mbps" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <ChartPanel empty={!hasMetrics} title="Latency" subtitle="Round-trip latency over time">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={metrics}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    dataKey="latencyMs"
                    name="Latency ms"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel empty={!hasMetrics} title="Packet Loss" subtitle="Packet-loss percentage across samples">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={metrics}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    dataKey="packetLossPercent"
                    name="Packet loss %"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
            <RecentAlerts alerts={dashboard?.recentAlerts ?? []} empty={!hasAlerts} />
            <DeviceActivity devices={dashboard?.recentDevices ?? []} empty={!hasDevices} />
            <DeviceHealth summary={summary} />
          </div>
        </div>
      )}
    </>
  );
}

export function PageHeader({ badge, children, description, onLogout, title }) {
  return (
    <header className="flex flex-col gap-4 border-b border-cloudnet-line pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-normal">{title}</h2>
          {badge && (
            <span className="rounded-full border border-cloudnet-line bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {badge}
            </span>
          )}
          {children}
        </div>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-blue hover:text-cloudnet-blue"
      >
        <LogOut aria-hidden="true" size={17} />
        Logout
      </button>
    </header>
  );
}

function SummaryGrid({ summary }) {
  const cards = [
    { label: 'Total Devices', value: summary.totalDevices ?? 0, icon: Monitor, tone: 'text-cloudnet-blue' },
    { label: 'Online Devices', value: summary.onlineDevices ?? 0, icon: Signal, tone: 'text-cloudnet-green' },
    { label: 'Offline Devices', value: summary.offlineDevices ?? 0, icon: WifiOff, tone: 'text-cloudnet-red' },
    { label: 'Average Latency', value: `${summary.averageLatencyMs ?? 0} ms`, icon: Gauge, tone: 'text-cloudnet-amber' },
    { label: 'Upload Traffic', value: `${summary.uploadMbps ?? 0} Mbps`, icon: Cloud, tone: 'text-cloudnet-cyan' },
    { label: 'Download Traffic', value: `${summary.downloadMbps ?? 0} Mbps`, icon: Router, tone: 'text-cloudnet-blue' },
    { label: 'Packet Loss', value: `${summary.packetLossPercent ?? 0}%`, icon: AlertTriangle, tone: 'text-cloudnet-red' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="min-h-28 rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{card.label}</p>
              <p className="mt-3 text-2xl font-bold tracking-normal">{card.value}</p>
            </div>
            <card.icon aria-hidden="true" className={card.tone} size={22} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartPanel({ children, empty, subtitle, title }) {
  return (
    <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-5 h-[260px] min-w-0">
        {empty ? <EmptyState message="No metric samples are available yet." /> : children}
      </div>
    </section>
  );
}

function RecentAlerts({ alerts, empty }) {
  return (
    <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Recent Alerts</h3>
      <div className="mt-4 space-y-3">
        {empty ? (
          <EmptyState compact message="No alerts have been recorded." />
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-cloudnet-line p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{alert.type.replace('_', ' ')}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DeviceActivity({ devices, empty }) {
  return (
    <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Recent Device Activity</h3>
      <div className="mt-4 space-y-3">
        {empty ? (
          <EmptyState compact message="No devices are registered yet." />
        ) : (
          devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between gap-3 rounded-lg border border-cloudnet-line p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{device.name}</p>
                <p className="truncate text-xs text-slate-500">{device.ipAddress}</p>
              </div>
              <StatusBadge status={device.status} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DeviceHealth({ summary }) {
  const total = summary.totalDevices || 0;
  const online = summary.onlineDevices || 0;
  const degraded = summary.degradedDevices || 0;
  const offline = summary.offlineDevices || 0;
  const onlineWidth = total ? `${(online / total) * 100}%` : '0%';
  const degradedWidth = total ? `${(degraded / total) * 100}%` : '0%';
  const offlineWidth = total ? `${(offline / total) * 100}%` : '0%';

  return (
    <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Device Health</h3>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full">
          <div className="bg-cloudnet-green" style={{ width: onlineWidth }} />
          <div className="bg-cloudnet-amber" style={{ width: degradedWidth }} />
          <div className="bg-cloudnet-red" style={{ width: offlineWidth }} />
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <HealthRow label="Online" value={online} />
        <HealthRow label="Degraded" value={degraded} />
        <HealthRow label="Offline" value={offline} />
      </div>
    </section>
  );
}

function HealthRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ComingSoonView({ onLogout, title }) {
  return (
    <>
      <PageHeader
        badge="Upcoming"
        description="This section will be implemented in its scheduled phase."
        onLogout={onLogout}
        title={title}
      />
      <div className="py-6">
        <EmptyState message="This view is intentionally reserved for a later project phase." />
      </div>
    </>
  );
}

export function PageLoading({ message }) {
  return (
    <div className="grid min-h-[520px] place-items-center">
      <div className="rounded-lg border border-cloudnet-line bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Loader2 aria-hidden="true" className="animate-spin text-cloudnet-blue" size={18} />
          {message}
        </span>
      </div>
    </div>
  );
}

export function PageError({ message, title }) {
  return (
    <div className="py-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-cloudnet-red">
        <div className="flex items-start gap-3">
          <Database aria-hidden="true" size={22} />
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ compact = false, message }) {
  return (
    <div
      className={`grid place-items-center rounded-lg border border-dashed border-cloudnet-line bg-slate-50 text-center text-sm font-medium text-slate-500 ${
        compact ? 'min-h-24 px-4 py-5' : 'min-h-64 px-4'
      }`}
    >
      <div>
        <ShieldCheck aria-hidden="true" className="mx-auto mb-2 text-slate-400" size={20} />
        {message}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const tones = {
    online: 'border-green-200 bg-green-50 text-cloudnet-green',
    degraded: 'border-amber-200 bg-amber-50 text-cloudnet-amber',
    offline: 'border-red-200 bg-red-50 text-cloudnet-red',
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[status] ?? tones.offline}`}>
      {status}
    </span>
  );
}

function formatTime(value) {
  if (!value) return 'Never';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
