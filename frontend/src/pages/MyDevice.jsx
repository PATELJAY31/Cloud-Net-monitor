import { useEffect, useMemo, useState } from 'react';
import { Clock, Cloud, Globe2, MonitorSmartphone, Wifi } from 'lucide-react';
import { PageHeader } from './ConsolePrimitives.jsx';
import { getNetworkPing } from '../services/api.js';

const CLIENT_ID_KEY = 'cloudnet.browserClientId';
const UNSUPPORTED = 'Not supported by this browser';

export function MyDevicePage({ onLogout }) {
  const [clientId] = useState(() => getClientId());
  const [online, setOnline] = useState(window.navigator.onLine);
  const [checks, setChecks] = useState([]);
  const [cloudReachable, setCloudReachable] = useState(false);
  const [lastSuccess, setLastSuccess] = useState('');

  useEffect(() => {
    const handleOnline = () => setOnline(window.navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function measure() {
      const started = window.performance.now();
      try {
        await getNetworkPing();
        const latencyMs = Math.round(window.performance.now() - started);
        if (!cancelled) {
          setCloudReachable(true);
          setLastSuccess(new Date().toLocaleTimeString());
          setChecks((current) => [...current.slice(-19), { ok: true, latencyMs }]);
        }
      } catch {
        if (!cancelled) {
          setCloudReachable(false);
          setChecks((current) => [...current.slice(-19), { ok: false, latencyMs: null }]);
        }
      }
    }

    measure();
    const id = window.setInterval(measure, 7000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    const successful = checks.filter((check) => check.ok);
    const latencies = successful.map((check) => check.latencyMs);
    return {
      current: latencies.at(-1) ?? null,
      average: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : null,
      min: latencies.length ? Math.min(...latencies) : null,
      max: latencies.length ? Math.max(...latencies) : null,
      successCount: successful.length,
      failureCount: checks.length - successful.length,
    };
  }, [checks]);

  const connection = window.navigator.connection || window.navigator.mozConnection || window.navigator.webkitConnection;

  return (
    <>
      <PageHeader
        description="Analyze the browser, connection, and CloudNet API connectivity of the device currently using this dashboard."
        onLogout={onLogout}
        title="My Device"
      />
      <div className="grid gap-5 py-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold">Device Overview</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard icon={MonitorSmartphone} label="Browser Session ID" value={clientId} />
            <InfoCard icon={Wifi} label="Status" value={online ? 'Online' : 'Offline'} />
            <InfoCard icon={Cloud} label="Cloud API" value={cloudReachable ? 'Reachable' : 'Unreachable'} />
            <InfoCard icon={Clock} label="Current RTT" value={formatMs(stats.current)} />
          </div>
        </section>

        <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold">Browser & Platform</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <Row label="User Agent" value={window.navigator.userAgent} />
            <Row label="Platform" value={window.navigator.userAgentData?.platform || window.navigator.platform || UNSUPPORTED} />
            <Row label="Language" value={window.navigator.language} />
            <Row label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} />
            <Row label="Screen" value={`${window.screen.width} x ${window.screen.height}`} />
            <Row label="Device Pixel Ratio" value={String(window.devicePixelRatio)} />
          </div>
        </section>

        <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold">Connection Information</h3>
          <p className="mt-1 text-sm text-slate-500">Browser-reported estimate where supported.</p>
          <div className="mt-5 grid gap-3 text-sm">
            <Row label="Connection Type" value={connection?.type || UNSUPPORTED} />
            <Row label="Effective Type" value={connection?.effectiveType || UNSUPPORTED} />
            <Row label="Estimated Downlink" value={connection?.downlink ? `${connection.downlink} Mbps` : UNSUPPORTED} />
            <Row label="Browser RTT Estimate" value={connection?.rtt ? `${connection.rtt} ms` : UNSUPPORTED} />
            <Row label="Data Saver" value={connection?.saveData === undefined ? UNSUPPORTED : connection.saveData ? 'On' : 'Off'} />
          </div>
        </section>

        <section className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold">Cloud API Connectivity</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard icon={Globe2} label="Online" value={online ? 'Online' : 'Offline'} />
            <InfoCard icon={Cloud} label="API Reachability" value={cloudReachable ? 'Reachable' : 'Unreachable'} />
            <InfoCard icon={Clock} label="Last Success" value={lastSuccess || 'No successful check yet'} />
            <InfoCard icon={Clock} label="Successful / Failed" value={`${stats.successCount} / ${stats.failureCount}`} />
            <InfoCard icon={Clock} label="Average RTT" value={formatMs(stats.average)} />
            <InfoCard icon={Clock} label="Min / Max RTT" value={`${formatMs(stats.min)} / ${formatMs(stats.max)}`} />
          </div>
        </section>

        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-cloudnet-blue xl:col-span-2">
          Browser Mode analyzes information exposed by the browser and measures connectivity between this device and the
          CloudNet API. It cannot access private network interface counters, packets sent/received by the operating
          system, or automatically discover all devices on the local network.
        </section>
      </div>
    </>
  );
}

function getClientId() {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-slate-50 p-4">
      <Icon aria-hidden="true" className="text-cloudnet-blue" size={20} />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-cloudnet-line p-3 sm:flex-row sm:justify-between">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="break-words font-bold">{value}</span>
    </div>
  );
}

function formatMs(value) {
  return value === null || value === undefined ? 'No data' : `${value} ms`;
}
