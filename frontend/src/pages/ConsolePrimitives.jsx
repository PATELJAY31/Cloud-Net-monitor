import { Database, Loader2, LogOut, ShieldCheck } from 'lucide-react';

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
