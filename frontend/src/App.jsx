import { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Loader2,
  LockKeyhole,
  Mail,
  Server,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard.jsx';
import { getCurrentUser, getHealth, loginUser, registerUser } from './services/api.js';

const statusTone = {
  connected: 'text-cloudnet-green bg-green-50 border-green-200',
  disconnected: 'text-cloudnet-amber bg-amber-50 border-amber-200',
  not_configured: 'text-cloudnet-amber bg-amber-50 border-amber-200',
  error: 'text-cloudnet-red bg-red-50 border-red-200',
  loading: 'text-cloudnet-blue bg-blue-50 border-blue-200',
};

const AUTH_STORAGE_KEY = 'cloudnet.auth';

function readStoredSession() {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [session, setSession] = useState(() => readStoredSession());
  const [sessionStatus, setSessionStatus] = useState(session?.token ? 'checking' : 'anonymous');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.token) {
      setSessionStatus('anonymous');
      return undefined;
    }

    let isMounted = true;
    setSessionStatus('checking');

    getCurrentUser(session.token)
      .then((result) => {
        if (isMounted) {
          const verifiedSession = {
            token: session.token,
            user: result.data.user,
          };
          setSession(verifiedSession);
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(verifiedSession));
          setSessionStatus('authenticated');
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setAuthError(requestError.message);
          setSession(null);
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setSessionStatus('anonymous');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.token]);

  const apiStatus = error ? 'error' : health?.status ?? 'loading';
  const databaseStatus = health?.database?.status ?? (error ? 'error' : 'loading');

  function handleAuthenticated(result) {
    const nextSession = {
      token: result.data.token,
      user: result.data.user,
    };
    setSession(nextSession);
    setSessionStatus('authenticated');
    setAuthError('');
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  }

  function handleLogout() {
    setSession(null);
    setSessionStatus('anonymous');
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  if (sessionStatus === 'authenticated') {
    return <Dashboard onLogout={handleLogout} token={session.token} user={session.user} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-cloudnet-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between border-b border-cloudnet-line pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-cloudnet-blue text-white shadow-sm">
              <Activity aria-hidden="true" size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cloudnet-cyan">CloudNet Monitor</p>
              <h1 className="text-xl font-bold">Network Monitoring Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-cloudnet-line bg-white px-3 py-1 text-sm font-medium text-slate-600">
              Phase 5 Dashboard
            </span>
          </div>
        </nav>

        <LoginScreen
          apiStatus={apiStatus}
          authError={authError}
          databaseStatus={databaseStatus}
          error={error}
          health={health}
          isCheckingSession={sessionStatus === 'checking'}
          onAuthenticated={handleAuthenticated}
          onAuthError={setAuthError}
        />
      </section>
    </main>
  );
}

function LoginScreen({
  apiStatus,
  authError,
  databaseStatus,
  error,
  health,
  isCheckingSession,
  onAuthenticated,
  onAuthError,
}) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const title = mode === 'login' ? 'Sign in to CloudNet' : 'Create CloudNet account';
  const actionLabel = mode === 'login' ? 'Login' : 'Register';

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (mode === 'register' && form.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (!form.email.includes('@')) {
      return 'Enter a valid email address.';
    }

    if (mode === 'register' && form.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (mode === 'login' && form.password.length === 0) {
      return 'Password is required.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextValidationError = validateForm();
    setValidationError(nextValidationError);
    onAuthError('');

    if (nextValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await loginUser({ email: form.email, password: form.password })
          : await registerUser({ name: form.name, email: form.email, password: form.password });
      onAuthenticated(result);
    } catch (requestError) {
      onAuthError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <form className="rounded-lg border border-cloudnet-line bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cloudnet-cyan">Secure access</p>
            <h2 className="mt-2 text-2xl font-bold">{title}</h2>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-cloudnet-blue text-white">
            {mode === 'login' ? <LockKeyhole aria-hidden="true" size={22} /> : <UserPlus aria-hidden="true" size={22} />}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Name</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-cloudnet-line px-3 text-sm outline-none transition focus:border-cloudnet-blue focus:ring-2 focus:ring-blue-100"
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Network admin"
                type="text"
                value={form.name}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <div className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-cloudnet-line px-3 transition focus-within:border-cloudnet-blue focus-within:ring-2 focus-within:ring-blue-100">
              <Mail aria-hidden="true" className="text-slate-400" size={18} />
              <input
                className="w-full bg-transparent text-sm outline-none"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="admin@cloudnet.local"
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-cloudnet-line px-3 text-sm outline-none transition focus:border-cloudnet-blue focus:ring-2 focus:ring-blue-100"
              onChange={(event) => updateField('password', event.target.value)}
              placeholder={mode === 'login' ? 'Enter your password' : 'Minimum 8 characters'}
              type="password"
              value={form.password}
            />
          </label>
        </div>

        {(validationError || authError) && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-cloudnet-red">
            {validationError || authError}
          </div>
        )}

        {isCheckingSession && (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-cloudnet-blue">
            Checking saved session...
          </div>
        )}

        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cloudnet-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <Loader2 aria-hidden="true" className="animate-spin" size={18} />}
          {actionLabel}
        </button>

        <button
          className="mt-4 text-sm font-semibold text-cloudnet-blue hover:text-blue-700"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'register' : 'login'));
            setValidationError('');
            onAuthError('');
          }}
          type="button"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </form>

      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cloudnet-cyan">
          Cloud-based traffic analysis
        </p>
        <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal md:text-5xl">
          Authentication for a real network monitoring platform.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Login and registration call the Express API, passwords are hashed with bcrypt, and protected requests use a JWT
          bearer token. No MongoDB secrets or auth shortcuts live in the frontend.
        </p>

        <div className="mt-8">
          <RuntimePanel apiStatus={apiStatus} databaseStatus={databaseStatus} error={error} health={health} />
        </div>
      </div>
    </div>
  );
}

function RuntimePanel({ apiStatus, databaseStatus, error, health }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Runtime Status</h3>
      <p className="mt-1 text-sm text-slate-500">Live status from the Express health endpoint.</p>

      <div className="mt-6 space-y-4">
        <StatusRow label="API" status={apiStatus} detail={error || health?.message || 'Checking backend'} />
        <StatusRow
          label="Database"
          status={databaseStatus}
          detail={health?.database?.message || 'Waiting for database status'}
        />
        <StatusRow label="Authentication" status="connected" detail="JWT routes are active on the backend." />
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-cloudnet-line bg-white p-4 shadow-sm">
      <Icon className="text-cloudnet-blue" aria-hidden="true" size={22} />
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function StatusRow({ label, status, detail }) {
  return (
    <div className="rounded-lg border border-cloudnet-line p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold">{label}</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[status] ?? statusTone.loading}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

export default App;
