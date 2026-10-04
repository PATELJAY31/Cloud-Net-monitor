import { useState } from 'react';
import { AlertTriangle, Database, FlaskConical, RadioTower, SignalHigh, WifiOff, Wifi } from 'lucide-react';
import { PageError, PageHeader } from './ConsolePrimitives.jsx';
import { seedDemoData, simulateDemoScenario } from '../services/api.js';

const scenarios = [
  {
    id: 'high_latency',
    label: 'High Latency',
    description: 'Creates a demo latency spike and alert.',
    icon: SignalHigh,
  },
  {
    id: 'packet_loss',
    label: 'Packet Loss',
    description: 'Creates packet-loss metrics and alert.',
    icon: AlertTriangle,
  },
  {
    id: 'high_traffic',
    label: 'High Traffic',
    description: 'Creates traffic above the configured threshold.',
    icon: RadioTower,
  },
  {
    id: 'device_offline',
    label: 'Device Offline',
    description: 'Marks a demo device offline and creates an alert.',
    icon: WifiOff,
  },
  {
    id: 'device_online',
    label: 'Device Online',
    description: 'Returns a demo device to online status.',
    icon: Wifi,
  },
];

export function DemoModePage({ onLogout, token }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function seed() {
    setStatus('loading');
    setError('');
    try {
      const result = await seedDemoData(token);
      setMessage(`${result.data.message} ${result.data.devices.length} devices and ${result.data.metricsCreated} metric samples created.`);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }

  async function simulate(scenario) {
    setStatus('loading');
    setError('');
    try {
      const result = await simulateDemoScenario(token, scenario);
      setMessage(`${result.data.message} Scenario: ${scenario.replace('_', ' ')} on ${result.data.device.name}.`);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }

  return (
    <>
      <PageHeader
        badge="Phase 10"
        description="Generate clearly labeled Demo Data for project demonstration without physical hardware."
        onLogout={onLogout}
        title="Demo Mode"
      />

      <div className="py-6">
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-cloudnet-blue">
          <div className="flex items-start gap-3">
            <FlaskConical aria-hidden="true" className="mt-0.5 shrink-0" size={22} />
            <div>
              <h3 className="font-bold">Demo Data</h3>
              <p className="mt-2 text-sm leading-6">
                Demo Mode stores simulated devices, metrics, and alerts in MongoDB with `source: demo`. It is for
                demonstrations only and is not presented as real network measurement.
              </p>
            </div>
          </div>
        </section>

        {status === 'error' && <PageError message={error} title="Demo Mode action failed" />}

        {message && status !== 'error' && (
          <section className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-cloudnet-green">
            {message}
          </section>
        )}

        <section className="mt-5 rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-bold">Seed Demo Dataset</h3>
              <p className="mt-1 text-sm text-slate-500">Creates realistic demo devices, historical metrics, and alerts.</p>
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cloudnet-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              disabled={status === 'loading'}
              onClick={seed}
              type="button"
            >
              <Database aria-hidden="true" size={18} />
              Seed Demo Data
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
              <scenario.icon aria-hidden="true" className="text-cloudnet-blue" size={24} />
              <h3 className="mt-4 text-base font-bold">{scenario.label}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{scenario.description}</p>
              <button
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-blue hover:text-cloudnet-blue disabled:opacity-60"
                disabled={status === 'loading'}
                onClick={() => simulate(scenario.id)}
                type="button"
              >
                Run Simulation
              </button>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
