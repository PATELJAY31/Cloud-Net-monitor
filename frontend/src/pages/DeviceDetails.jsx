import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Cpu, Globe2, HardDrive, Monitor, Network, RadioTower } from 'lucide-react';
import {
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
import {
  ChartPanel,
  EmptyState,
  PageError,
  PageHeader,
  PageLoading,
  StatusBadge,
} from './ConsolePrimitives.jsx';
import { getDeviceDetails } from '../services/api.js';
import { formatTime } from '../utils/format.js';

export function DeviceDetailsPage({ deviceId, onBack, onLogout, token }) {
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deviceId) {
      setStatus('error');
      setError('No device was selected.');
      return undefined;
    }

    let isMounted = true;
    setStatus('loading');

    getDeviceDetails(token, deviceId)
      .then((result) => {
        if (isMounted) {
          setDetails(result.data);
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
  }, [deviceId, token]);

  const metrics = useMemo(
    () =>
      (details?.metrics ?? []).map((metric) => ({
        ...metric,
        time: formatTime(metric.timestamp),
      })),
    [details],
  );

  const device = details?.device;
  const latest = device?.latestMetrics ?? {};
  const hasMetrics = metrics.length > 0;

  return (
    <>
      <PageHeader
        badge="Device Details"
        description="Inspect device identity, current network statistics, and historical metric samples."
        onLogout={onLogout}
        title={device?.name ?? 'Device Details'}
      >
        {device?.status && <StatusBadge status={device.status} />}
      </PageHeader>

      <div className="py-6">
        <button
          className="mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-blue hover:text-cloudnet-blue"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to devices
        </button>

        {status === 'loading' && <PageLoading message="Loading device details" />}
        {status === 'error' && <PageError message={error} title="Device details are unavailable" />}
        {status === 'ready' && device && (
          <>
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold">Device Information</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoItem icon={Monitor} label="Name" value={device.name} />
                  <InfoItem icon={Cpu} label="Hostname" value={device.hostname} />
                  <InfoItem icon={Globe2} label="IP Address" value={device.ipAddress} />
                  <InfoItem icon={HardDrive} label="Operating System" value={device.operatingSystem} />
                  <InfoItem icon={RadioTower} label="Source" value={device.source} />
                  <InfoItem icon={Network} label="Last Seen" value={formatDateTime(device.lastSeenAt)} />
                </div>
              </section>

              <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold">Network Statistics</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <MetricBox label="Latency" value={`${latest.latencyMs ?? 0} ms`} />
                  <MetricBox label="Upload" value={`${latest.uploadMbps ?? 0} Mbps`} />
                  <MetricBox label="Download" value={`${latest.downloadMbps ?? 0} Mbps`} />
                  <MetricBox label="Packet Loss" value={`${latest.packetLossPercent ?? 0}%`} />
                  <MetricBox label="Packets Sent" value={(latest.packetsSent ?? 0).toLocaleString()} />
                  <MetricBox label="Packets Received" value={(latest.packetsReceived ?? 0).toLocaleString()} />
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
              <ChartPanel empty={!hasMetrics} title="Latency History" subtitle="Device latency over recent samples">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={metrics}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line dataKey="latencyMs" name="Latency ms" stroke="#d97706" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel empty={!hasMetrics} title="Traffic History" subtitle="Upload and download throughput">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.slice(-24)}>
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

            <div className="mt-5">
              <ChartPanel empty={!hasMetrics} title="Packet Statistics" subtitle="Packets sent, received, and loss">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={metrics}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line dataKey="packetsSent" name="Packets sent" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line
                      dataKey="packetsReceived"
                      name="Packets received"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="packetLossPercent"
                      name="Packet loss %"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            {device.networkInterfaces?.length > 0 && (
              <section className="mt-5 rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold">Network Interfaces</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {device.networkInterfaces.map((item) => (
                    <div key={`${item.name}-${item.ipAddress}`} className="rounded-lg border border-cloudnet-line p-3">
                      <p className="font-semibold">{item.name || 'Interface'}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.ipAddress || 'No IP address'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{item.family}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!hasMetrics && (
              <div className="mt-5">
                <EmptyState message="This device has no historical metric samples yet." />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line p-3">
      <Icon aria-hidden="true" className="text-cloudnet-blue" size={19} />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold">{value || 'Not available'}</p>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return 'Never';
  }

  return `${new Date(value).toLocaleDateString()} ${formatTime(value)}`;
}
