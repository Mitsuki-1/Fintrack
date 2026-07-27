import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 hover:scale-110"
      aria-label="Toggle dark mode"
    >
      <span className={`block transition-all duration-300 text-lg ${dark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'} absolute inset-0 flex items-center justify-center`}>
        🌙
      </span>
      <span className={`block transition-all duration-300 text-lg ${dark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'} absolute inset-0 flex items-center justify-center`}>
        ☀️
      </span>
      <span className="text-lg invisible">☀️</span>
    </button>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const links = [
    { path: '/', label: 'Дашборд' },
    { path: '/incomes', label: 'Доходы' },
    { path: '/expenses', label: 'Расходы' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 shadow-sm animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2 sm:gap-6">
        <Link to="/" className="text-xl font-bold text-gradient shrink-0 tracking-tight">
          FinTrack
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
            {user.displayName || user.email}
          </span>
          <DarkModeToggle />
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-slate-100 dark:border-slate-700/50">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex-1 text-center py-2.5 text-xs font-medium transition-all duration-200 ${
              location.pathname === link.path
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/incomes" element={<ProtectedRoute><Incomes /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <Navbar />
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
