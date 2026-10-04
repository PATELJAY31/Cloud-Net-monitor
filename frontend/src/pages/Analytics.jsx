import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Clock, Monitor } from 'lucide-react';
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
import { ChartPanel, EmptyState, PageError, PageHeader, PageLoading } from './ConsolePrimitives.jsx';
import { getDevices, getMetrics } from '../services/api.js';
import { formatTime } from '../utils/format.js';

const rangeOptions = [
  { label: 'Last 15 minutes', value: '15m' },
  { label: 'Last hour', value: '1h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
];

export function AnalyticsPage({ onLogout, token }) {
  const [range, setRange] = useState('1h');
  const [deviceId, setDeviceId] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    Promise.all([
      getMetrics(token, {
        range,
        deviceId,
        limit: 300,
        page: 1,
      }),
      getDevices(token, {
        limit: 300,
        page: 1,
      }),
    ])
      .then(([metricsResult, devicesResult]) => {
        if (isMounted) {
          setMetrics(metricsResult.data.metrics);
          setDevices(devicesResult.data.devices);
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
  }, [deviceId, range, token]);

  const chartData = useMemo(
    () =>
      metrics.map((metric) => ({
        ...metric,
        time: formatTime(metric.timestamp),
        trafficMbps: Number(((metric.uploadMbps ?? 0) + (metric.downloadMbps ?? 0)).toFixed(2)),
      })),
    [metrics],
  );

  const totals = useMemo(
    () =>
      chartData.reduce(
        (accumulator, metric) => ({
          avgLatency: accumulator.avgLatency + (metric.latencyMs ?? 0),
          totalTraffic: accumulator.totalTraffic + metric.trafficMbps,
          packetLoss: accumulator.packetLoss + (metric.packetLossPercent ?? 0),
          packets: accumulator.packets + (metric.packetsSent ?? 0) + (metric.packetsReceived ?? 0),
        }),
        { avgLatency: 0, totalTraffic: 0, packetLoss: 0, packets: 0 },
      ),
    [chartData],
  );

  const divisor = chartData.length || 1;
  const hasMetrics = chartData.length > 0;

  return (
    <>
      <PageHeader
        badge="Phase 7"
        description="Analyze bandwidth, latency, packet statistics, and packet loss across selected time windows."
        onLogout={onLogout}
        title="Network Analytics"
      />

      <div className="py-6">
        <section className="rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3">
              <Clock aria-hidden="true" className="text-slate-400" size={18} />
              <select
                className="w-full bg-transparent text-sm font-semibold outline-none"
                onChange={(event) => setRange(event.target.value)}
                value={range}
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3">
              <Monitor aria-hidden="true" className="text-slate-400" size={18} />
              <select
                className="w-full bg-transparent text-sm font-semibold outline-none"
                onChange={(event) => setDeviceId(event.target.value)}
                value={deviceId}
              >
                <option value="">All devices</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} - {device.ipAddress}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {status === 'loading' && <PageLoading message="Loading analytics" />}
        {status === 'error' && <PageError message={error} title="Analytics are unavailable" />}
        {status === 'ready' && (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Activity} label="Samples" value={chartData.length.toLocaleString()} />
              <MetricCard label="Avg Latency" value={`${(totals.avgLatency / divisor).toFixed(2)} ms`} />
              <MetricCard label="Total Traffic" value={`${totals.totalTraffic.toFixed(2)} Mbps`} />
              <MetricCard label="Avg Packet Loss" value={`${(totals.packetLoss / divisor).toFixed(2)}%`} />
            </div>

            {!hasMetrics ? (
              <div className="mt-5">
                <EmptyState message="No metric samples are available for the selected filters." />
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <ChartPanel empty={false} title="Bandwidth" subtitle="Combined upload and download traffic">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={chartData}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area dataKey="trafficMbps" name="Total Mbps" stroke="#2563eb" fill="#bfdbfe" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel empty={false} title="Upload / Download" subtitle="Traffic direction comparison">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData.slice(-24)}>
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
                  <ChartPanel empty={false} title="Latency" subtitle="Round-trip latency trend">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line dataKey="latencyMs" name="Latency ms" stroke="#d97706" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>

                  <ChartPanel empty={false} title="Packet Loss" subtitle="Loss percentage across samples">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData}>
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
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                </div>

                <div className="mt-5">
                  <ChartPanel empty={false} title="Packet Statistics" subtitle="Packet transmission and reception">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData}>
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
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartPanel>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function MetricCard({ icon: Icon = BarChart3, label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-normal">{value}</p>
        </div>
        <Icon aria-hidden="true" className="text-cloudnet-blue" size={22} />
      </div>
    </div>
  );
}
