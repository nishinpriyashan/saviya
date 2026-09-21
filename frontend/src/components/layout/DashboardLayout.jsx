import { Link } from 'react-router-dom';
import { LogOut, ShieldCheck, User, ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/config';

const roleMeta = {
  Beneficiary: { color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Donor:       { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  GN:          { color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Admin:       { color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function DashboardLayout({ children, roleTitle }) {
  const { userData } = useAuth();
  const badgeStyle = roleMeta[roleTitle]?.color || 'bg-primary/10 text-primary border-primary/20';
  const handleSignOut = () => auth?.signOut();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary-700 via-primary-400 to-primary-700 animate-shimmer" />

        <div className="container mx-auto px-4 h-15 flex items-center justify-between py-3">

          {/* Brand + breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Saviya logo — navigates to Home, does NOT log out */}
            <Link to="/" className="flex items-center gap-2 group" title="Back to Home page">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground hidden sm:block">Saviya</span>
            </Link>

            <ChevronRight className="h-4 w-4 text-muted-foreground/50 hidden sm:block" />

            <span className={`hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${badgeStyle}`}>
              {roleTitle} Portal
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Home shortcut — clearly labelled so users know it won't sign them out */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Home</span>
            </Link>

            {userData?.displayName && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-border px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="max-w-[140px] truncate">{userData.displayName}</span>
              </div>
            )}

            {/* Sign Out — only button that actually signs out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t bg-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Saviya Platform — {roleTitle} Portal</span>
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" /> Back to Home
          </Link>
          <span>© {new Date().getFullYear()} Academic Prototype</span>
        </div>
      </footer>
    </div>
  );
}
