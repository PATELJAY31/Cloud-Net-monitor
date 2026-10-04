import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Filter, ShieldAlert } from 'lucide-react';
import { EmptyState, PageError, PageHeader, PageLoading } from './ConsolePrimitives.jsx';
import { getAlerts, updateAlert } from '../services/api.js';

const severityOptions = [
  { label: 'All severities', value: '' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
];

const typeOptions = [
  { label: 'All types', value: '' },
  { label: 'High latency', value: 'high_latency' },
  { label: 'Packet loss', value: 'packet_loss' },
  { label: 'Device offline', value: 'device_offline' },
  { label: 'High traffic', value: 'high_traffic' },
];

const readOptions = [
  { label: 'All states', value: '' },
  { label: 'Unread', value: 'false' },
  { label: 'Read', value: 'true' },
];

export function AlertsPage({ onLogout, token }) {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [read, setRead] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const filters = useMemo(
    () => ({
      limit: 100,
      page: 1,
      severity,
      type,
      read,
    }),
    [read, severity, type],
  );

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    getAlerts(token, filters)
      .then((result) => {
        if (isMounted) {
          setAlerts(result.data.alerts);
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
  }, [filters, token]);

  async function patchAlert(alertId, patch) {
    setUpdatingId(alertId);
    try {
      const result = await updateAlert(token, alertId, patch);
      setAlerts((current) => current.map((alert) => (alert.id === alertId ? result.data.alert : alert)));
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <>
      <PageHeader
        badge="Phase 8"
        description="Review high latency, packet loss, device offline, and high traffic alerts."
        onLogout={onLogout}
        title="Alerts"
      />

      <div className="py-6">
        <section className="rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <FilterSelect icon={Filter} label="Severity" onChange={setSeverity} options={severityOptions} value={severity} />
            <FilterSelect icon={ShieldAlert} label="Type" onChange={setType} options={typeOptions} value={type} />
            <FilterSelect icon={Eye} label="Read state" onChange={setRead} options={readOptions} value={read} />
          </div>
        </section>

        {status === 'loading' && <PageLoading message="Loading alerts" />}
        {status === 'error' && <PageError message={error} title="Alerts are unavailable" />}
        {status === 'ready' && (
          <section className="mt-5 rounded-lg border border-cloudnet-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-cloudnet-line px-5 py-4">
              <div>
                <h3 className="text-base font-bold">Network Alerts</h3>
                <p className="mt-1 text-sm text-slate-500">{pagination?.total ?? 0} alerts found</p>
              </div>
              <AlertTriangle aria-hidden="true" className="text-cloudnet-amber" size={22} />
            </div>

            {alerts.length === 0 ? (
              <div className="p-5">
                <EmptyState message="No alerts match the current filters." />
              </div>
            ) : (
              <div className="divide-y divide-cloudnet-line">
                {alerts.map((alert) => (
                  <article key={alert.id} className="grid gap-4 p-5 xl:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="rounded-full border border-cloudnet-line bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {formatAlertType(alert.type)}
                        </span>
                        <span className="rounded-full border border-cloudnet-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {alert.read ? 'Read' : 'Unread'}
                        </span>
                        {alert.resolved && (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-cloudnet-green">
                            Resolved
                          </span>
                        )}
                      </div>
                      <h4 className="mt-3 text-base font-bold">{alert.device?.name ?? 'Monitored device'}</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{alert.message}</p>
                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        {new Date(alert.timestamp).toLocaleString()}
                        {typeof alert.measuredValue === 'number' && typeof alert.thresholdValue === 'number'
                          ? ` · measured ${alert.measuredValue} / threshold ${alert.thresholdValue}`
                          : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-blue hover:text-cloudnet-blue disabled:opacity-60"
                        disabled={updatingId === alert.id || alert.read}
                        onClick={() => patchAlert(alert.id, { read: true })}
                        type="button"
                      >
                        <Eye aria-hidden="true" size={16} />
                        Mark read
                      </button>
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-green hover:text-cloudnet-green disabled:opacity-60"
                        disabled={updatingId === alert.id || alert.resolved}
                        onClick={() => patchAlert(alert.id, { resolved: true, read: true })}
                        type="button"
                      >
                        <CheckCircle2 aria-hidden="true" size={16} />
                        Resolve
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function FilterSelect({ icon: Icon, label, onChange, options, value }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3">
      <Icon aria-hidden="true" className="text-slate-400" size={18} />
      <span className="sr-only">{label}</span>
      <select
        className="w-full bg-transparent text-sm font-semibold outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SeverityBadge({ severity }) {
  const tones = {
    info: 'border-blue-200 bg-blue-50 text-cloudnet-blue',
    warning: 'border-amber-200 bg-amber-50 text-cloudnet-amber',
    critical: 'border-red-200 bg-red-50 text-cloudnet-red',
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[severity] ?? tones.info}`}>
      {severity}
    </span>
  );
}

function formatAlertType(type) {
  return type.replace('_', ' ');
}
