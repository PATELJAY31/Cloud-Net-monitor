import { useState } from 'react';
import { Globe2, Search } from 'lucide-react';
import { PageError, PageHeader } from './ConsolePrimitives.jsx';
import { analyzeNetworkTarget } from '../services/api.js';

export function TargetAnalyzerPage({ onLogout, token }) {
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function analyze(event) {
    event.preventDefault();
    if (!target.trim()) {
      setError('Enter a public URL, hostname, or IP address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');
    setResult(null);
    try {
      const response = await analyzeNetworkTarget(token, target.trim());
      setResult(response.data);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }

  return (
    <>
      <PageHeader
        description="Perform limited, safe application-level checks for public URLs and IP addresses from the CloudNet backend."
        onLogout={onLogout}
        title="Target Analyzer"
      />

      <div className="py-6">
        <form className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm" onSubmit={analyze}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Target</span>
            <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="h-11 rounded-lg border border-cloudnet-line px-3 text-sm outline-none transition focus:border-cloudnet-blue focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setTarget(event.target.value)}
                placeholder="example.com, https://example.com, 8.8.8.8"
                value={target}
              />
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cloudnet-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                disabled={status === 'loading'}
                type="submit"
              >
                <Search aria-hidden="true" size={18} />
                {status === 'loading' ? 'Analyzing target...' : 'Analyze Target'}
              </button>
            </div>
          </label>
        </form>

        {status === 'error' && <PageError message={error} title="Target analysis failed" />}
        {result && <ResultCard result={result} onAgain={() => setStatus('idle')} />}

        <section className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-cloudnet-blue">
          CloudNet Target Analyzer performs limited, safe application-level checks from the CloudNet backend. It does
          not perform port scanning, vulnerability scanning, or unrestricted network discovery.
        </section>
      </div>
    </>
  );
}

function ResultCard({ onAgain, result }) {
  return (
    <section className="mt-5 rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cloudnet-cyan">Target Analysis</p>
          <h3 className="mt-2 text-xl font-bold">{result.normalizedTarget}</h3>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cloudnet-line bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cloudnet-blue hover:text-cloudnet-blue"
          onClick={onAgain}
          type="button"
        >
          <Globe2 aria-hidden="true" size={17} />
          Analyze Again
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Item label="Status" value={result.reachable ? 'Reachable' : 'No HTTP/HTTPS service detected'} />
        <Item label="HTTP Status" value={result.http?.statusCode ? `${result.http.statusCode} ${result.http.statusMessage}` : 'Not available'} />
        <Item label="Protocol Tested" value={result.http?.protocol || 'Not available'} />
        <Item label="Response Time" value={result.http?.responseTimeMs ? `${result.http.responseTimeMs} ms` : 'Not available'} />
        <Item label="HTTPS" value={result.httpsAvailable ? 'Available' : 'Not confirmed'} />
        <Item label="Server" value={result.http?.server || 'Not disclosed'} />
        <Item label="DNS Lookup" value={result.dns?.resolved ? `${result.dns.lookupTimeMs} ms` : 'Not resolved'} />
        <Item label="IPv4" value={result.dns?.ipv4?.join(', ') || 'None'} />
        <Item label="IPv6" value={result.dns?.ipv6?.join(', ') || 'None'} />
        <Item label="Analyzed At" value={new Date(result.analyzedAt).toLocaleString()} />
      </div>
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold">{value}</p>
    </div>
  );
}
