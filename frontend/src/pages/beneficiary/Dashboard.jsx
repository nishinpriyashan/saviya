import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, XCircle, FileText, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(from + (value - from) * progress));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <span>{display}</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`} />;
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:           { color: 'bg-slate-100 text-slate-600',        icon: FileText,    label: 'Draft' },
  SUBMITTED:       { color: 'bg-blue-100 text-blue-700',          icon: Clock,       label: 'Submitted' },
  UNDER_REVIEW:    { color: 'bg-blue-100 text-blue-700',          icon: Clock,       label: 'Under Review' },
  GN_VERIFICATION: { color: 'bg-amber-100 text-amber-700',        icon: Clock,       label: 'GN Verification' },
  VERIFIED:        { color: 'bg-emerald-100 text-emerald-700',    icon: CheckCircle2,label: 'Verified' },
  REJECTED:        { color: 'bg-red-100 text-red-600',            icon: XCircle,     label: 'Rejected' },
  RETURNED:        { color: 'bg-orange-100 text-orange-700',      icon: XCircle,     label: 'Returned' },
  FUNDED:          { color: 'bg-primary text-white',              icon: CheckCircle2,label: 'Funded' },
  COMPLETED:       { color: 'bg-green-100 text-green-700',        icon: CheckCircle2,label: 'Completed' },
};

function StatusBadge({ status }) {
  const c = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.color}`}>
      <Icon className="h-3 w-3" /> {c.label}
    </span>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ request, index }) {
  return (
    <div
      className="group bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
      style={{ animationDelay: `${index * 80}ms`, animation: 'fadeInUp 0.6s ease both' }}
    >
      {/* Coloured top stripe by status */}
      <div className={`h-1.5 w-full ${
        request.status === 'FUNDED' || request.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
        request.status === 'VERIFIED' ? 'bg-gradient-to-r from-primary to-primary-400' :
        request.status === 'REJECTED' ? 'bg-gradient-to-r from-red-500 to-red-400' :
        'bg-gradient-to-r from-slate-300 to-slate-200'
      }`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            {request.category}
          </span>
          <StatusBadge status={request.status} />
        </div>

        <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {request.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
          {request.description}
        </p>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Amount needed</p>
            <p className="text-base font-bold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</p>
          </div>
          <Link to={`/beneficiary/request/${request.id}`}>
            <button className="text-sm font-semibold text-primary hover:text-primary-700 border border-primary/30 hover:border-primary rounded-xl px-4 py-2 hover:bg-primary/5 transition-all duration-200">
              View →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BeneficiaryDashboard() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, 'assistanceRequests'), where('beneficiaryId', '==', userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setRequests(reqs);
      setLoading(false);
    }, (err) => {
      setError('Could not load your requests: ' + err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [userData]);

  const stats = [
    { label: 'Total Requests',  value: requests.length,                                                    icon: FileText,    gradient: 'from-slate-500 to-slate-600',   bg: 'bg-slate-50' },
    { label: 'In Progress',     value: requests.filter(r => !['FUNDED','COMPLETED','REJECTED'].includes(r.status)).length, icon: TrendingUp,   gradient: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50' },
    { label: 'Verified',        value: requests.filter(r => r.status === 'VERIFIED').length,               icon: CheckCircle2,gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary/10' },
    { label: 'Funded',          value: requests.filter(r => ['FUNDED','COMPLETED'].includes(r.status)).length, icon: Sparkles,gradient: 'from-emerald-500 to-emerald-600',bg: 'bg-emerald-50' },
  ];

  return (
    <DashboardLayout roleTitle="Beneficiary">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Beneficiary Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Welcome back, <span className="text-gradient-green">{userData?.displayName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-1">Track your assistance requests and their progress.</p>
        </div>
        <Link to="/beneficiary/request/new" className="animate-fade-in delay-200">
          <button className="btn-glow bg-primary text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 text-sm shadow-lg hover:bg-primary-700 transition-all">
            <PlusCircle className="h-4 w-4" /> New Request
          </button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, gradient, bg }, i) => (
          <div
            key={i}
            className="stat-card card-hover bg-white border border-border rounded-2xl p-5 shadow-sm overflow-hidden relative"
            style={{ animation: `fadeInUp 0.6s ease both ${i * 80}ms` }}
          >
            {/* Background glow blob */}
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${bg} blur-xl opacity-60`} />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="text-3xl font-extrabold text-foreground">
                {loading ? '—' : <AnimatedNumber value={value} />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Requests ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Your Requests</h2>
        {requests.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">{requests.length} total</span>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5 animate-float">
            <FileText className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No requests yet</h3>
          <p className="text-muted-foreground max-w-sm mb-7 text-sm leading-relaxed">
            Create your first assistance request to get started. Our team will review it promptly.
          </p>
          <Link to="/beneficiary/request/new">
            <button className="btn-glow bg-primary text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-lg">
              Create First Request
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req, i) => <RequestCard key={req.id} request={req} index={i} />)}
        </div>
      )}
    </DashboardLayout>
  );
}
