import { useEffect, useMemo, useState } from 'react';
import { Monitor, Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState, PageError, PageHeader, PageLoading, StatusBadge } from './ConsolePrimitives.jsx';
import { getDevices } from '../services/api.js';
import { formatTime } from '../utils/format.js';

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Online', value: 'online' },
  { label: 'Degraded', value: 'degraded' },
  { label: 'Offline', value: 'offline' },
];

export function DevicesPage({ onLogout, onSelectDevice, token }) {
  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const query = useMemo(
    () => ({
      limit: 100,
      page: 1,
      search,
      status: statusFilter,
    }),
    [search, statusFilter],
  );

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    getDevices(token, query)
      .then((result) => {
        if (isMounted) {
          setDevices(result.data.devices);
          setPagination(result.data.pagination);
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
  }, [query, token]);

  return (
    <>
      <PageHeader
        badge="Phase 6"
        description="Search, filter, and inspect registered monitoring devices from the CloudNet API."
        onLogout={onLogout}
        title="Devices"
      />

      <div className="py-6">
        <section className="rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3 transition focus-within:border-cloudnet-blue focus-within:ring-2 focus-within:ring-blue-100">
              <Search aria-hidden="true" className="text-slate-400" size={18} />
              <input
                className="w-full bg-transparent text-sm outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, hostname, IP address, or OS"
                type="search"
                value={search}
              />
            </label>

            <label className="flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3">
              <SlidersHorizontal aria-hidden="true" className="text-slate-400" size={18} />
              <select
                className="w-full bg-transparent text-sm font-semibold outline-none"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                {statusOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {status === 'loading' && <PageLoading message="Loading devices" />}
        {status === 'error' && <PageError message={error} title="Devices are unavailable" />}
        {status === 'ready' && (
          <section className="mt-5 rounded-lg border border-cloudnet-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-cloudnet-line px-5 py-4">
              <div>
                <h3 className="text-base font-bold">Monitored Devices</h3>
                <p className="mt-1 text-sm text-slate-500">{pagination?.total ?? 0} devices found</p>
              </div>
              <Monitor aria-hidden="true" className="text-cloudnet-blue" size={22} />
            </div>

            {devices.length === 0 ? (
              <div className="p-5">
                <EmptyState message="No devices match the current filters." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <Th>Device</Th>
                      <Th>Hostname</Th>
                      <Th>IP Address</Th>
                      <Th>OS</Th>
                      <Th>Status</Th>
                      <Th>Last Seen</Th>
                      <Th>Latency</Th>
                      <Th>Upload</Th>
                      <Th>Download</Th>
                      <Th>Packets</Th>
                      <Th>Loss</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr
                        key={device.id}
                        className="cursor-pointer border-t border-cloudnet-line transition hover:bg-blue-50/60"
                        onClick={() => onSelectDevice(device.id)}
                      >
                        <Td>
                          <div>
                            <p className="font-bold text-cloudnet-ink">{device.name}</p>
                            <p className="text-xs text-slate-500">{device.source} source</p>
                          </div>
                        </Td>
                        <Td>{device.hostname}</Td>
                        <Td>{device.ipAddress}</Td>
                        <Td>{device.operatingSystem}</Td>
                        <Td>
                          <StatusBadge status={device.status} />
                        </Td>
                        <Td>{formatDateTime(device.lastSeenAt)}</Td>
                        <Td>{device.latestMetrics?.latencyMs ?? 0} ms</Td>
                        <Td>{device.latestMetrics?.uploadMbps ?? 0} Mbps</Td>
                        <Td>{device.latestMetrics?.downloadMbps ?? 0} Mbps</Td>
                        <Td>
                          {(device.latestMetrics?.packetsSent ?? 0).toLocaleString()} /{' '}
                          {(device.latestMetrics?.packetsReceived ?? 0).toLocaleString()}
                        </Td>
                        <Td>{device.latestMetrics?.packetLossPercent ?? 0}%</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-4 align-middle text-slate-700">{children}</td>;
}

function formatDateTime(value) {
  if (!value) {
    return 'Never';
  }

  return `${new Date(value).toLocaleDateString()} ${formatTime(value)}`;
}
