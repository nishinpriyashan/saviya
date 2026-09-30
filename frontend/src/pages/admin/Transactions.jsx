import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, getDocs, query, orderBy, doc, getDoc,
} from 'firebase/firestore';
import {
  DollarSign, TrendingUp, Users, CheckCircle2, Search,
  Download, RefreshCw, ArrowLeft, ExternalLink, CreditCard, Calendar,
} from 'lucide-react';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`} />;
}

function StatusBadge({ status }) {
  const map = {
    COMPLETED: { cls: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
    PENDING:   { cls: 'bg-amber-100 text-amber-700',   label: 'Pending' },
    FAILED:    { cls: 'bg-red-100 text-red-600',        label: 'Failed' },
    REFUNDED:  { cls: 'bg-slate-100 text-slate-600',    label: 'Refunded' },
  };
  const s = map[status] || { cls: 'bg-slate-100 text-slate-500', label: status };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(rows) {
  const headers = ['ID', 'Date', 'Donor Name', 'Donor Email', 'Request Title', 'Amount (LKR)', 'Status', 'Payment Method'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      r.createdAt ? new Date(r.createdAt).toLocaleString('en-LK') : '',
      `"${r.donorName || ''}"`,
      `"${r.donorEmail || ''}"`,
      `"${r.requestTitle || ''}"`,
      r.amount,
      r.status,
      r.paymentMethod || 'CARD_SIMULATED',
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saviya_transactions_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch all donations
      const donSnap = await getDocs(query(collection(db, 'donations'), orderBy('createdAt', 'desc')));
      const raw = donSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Enrich with donor & request info
      const donorCache = {};
      const requestCache = {};

      const enriched = await Promise.all(raw.map(async (tx) => {
        // Donor info
        if (tx.donorId && !donorCache[tx.donorId]) {
          try {
            const snap = await getDoc(doc(db, 'users', tx.donorId));
            donorCache[tx.donorId] = snap.exists() ? snap.data() : {};
          } catch (_) { donorCache[tx.donorId] = {}; }
        }
        // Request info
        if (tx.requestId && !requestCache[tx.requestId]) {
          try {
            const snap = await getDoc(doc(db, 'assistanceRequests', tx.requestId));
            requestCache[tx.requestId] = snap.exists() ? snap.data() : {};
          } catch (_) { requestCache[tx.requestId] = {}; }
        }

        const donor   = donorCache[tx.donorId] || {};
        const request = requestCache[tx.requestId] || {};

        return {
          ...tx,
          donorName:    donor.displayName || 'Unknown Donor',
          donorEmail:   donor.email || '',
          requestTitle: request.title || 'Unknown Request',
          requestCategory: request.category || '',
          createdAt:    tx.createdAt?.toDate?.() || null,
        };
      }));

      setTransactions(enriched);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  // ── Filter + Search + Sort ──
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterStatus !== 'ALL') list = list.filter(t => t.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.donorName?.toLowerCase().includes(q) ||
        t.donorEmail?.toLowerCase().includes(q) ||
        t.requestTitle?.toLowerCase().includes(q) ||
        t.id?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt') { av = a.createdAt?.getTime() ?? 0; bv = b.createdAt?.getTime() ?? 0; }
      if (sortField === 'amount')    { av = Number(av); bv = Number(bv); }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [transactions, filterStatus, search, sortField, sortDir]);

  // ── Stats ──
  const totalRaised   = transactions.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0);
  const totalDonors   = new Set(transactions.filter(t => t.status === 'COMPLETED').map(t => t.donorId)).size;
  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length;
  const avgDonation   = completedCount > 0 ? Math.round(totalRaised / completedCount) : 0;

  const stats = [
    { label: 'Total Raised',    value: totalRaised,    prefix: 'Rs.',    icon: DollarSign,   gradient: 'from-primary to-primary-600',     delay: 0   },
    { label: 'Completed',       value: completedCount, prefix: '',       icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600',    delay: 80  },
    { label: 'Unique Donors',   value: totalDonors,    prefix: '',       icon: Users,        gradient: 'from-violet-500 to-purple-600',    delay: 160 },
    { label: 'Avg. Donation',   value: avgDonation,    prefix: 'Rs. ',   icon: TrendingUp,   gradient: 'from-amber-500 to-orange-600',     delay: 240 },
  ];

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };
  const SortIcon = ({ field }) => (
    <span className={`ml-1 text-xs ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <DashboardLayout roleTitle="Admin">
      {/* ── Header ── */}
      <div className="mb-8 animate-fade-in-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" /> Transactions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Full audit trail of all donation transactions stored in Firebase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary border border-border px-4 py-2 rounded-xl hover:bg-primary/5 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 text-sm font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-all btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, prefix, icon: Icon, gradient, delay }) => (
          <div
            key={label}
            className="stat-card card-hover bg-white border border-border rounded-2xl p-5 shadow-sm overflow-hidden relative"
            style={{ animation: `fadeInUp 0.6s ease both ${delay}ms` }}
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-slate-100 blur-xl opacity-50" />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-extrabold text-foreground">
                {loading ? '—' : <AnimatedNumber value={value} prefix={prefix} />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-5" style={{ animation: 'fadeInUp 0.6s ease both 200ms' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search donor, email, request…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 shadow-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm py-2.5 bg-transparent focus:outline-none font-medium text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center px-3 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-medium border border-border">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div
        className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden"
        style={{ animation: 'fadeInUp 0.6s ease both 280ms' }}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 animate-float">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <p className="font-bold text-lg">No transactions found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {search || filterStatus !== 'ALL' ? 'Try adjusting your search or filters.' : 'Donations made by donors will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    <button onClick={() => handleSort('createdAt')} className="hover:text-foreground transition-colors">
                      Date <SortIcon field="createdAt" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Donor</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Request</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    <button onClick={() => handleSort('amount')} className="hover:text-foreground transition-colors">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Method</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border hover:bg-slate-50/80 transition-colors group"
                    style={{ animation: `fadeInUp 0.4s ease both ${i * 30}ms` }}
                  >
                    {/* Date */}
                    <td className="px-5 py-4">
                      {tx.createdAt ? (
                        <div>
                          <p className="font-medium text-foreground">
                            {tx.createdAt.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.createdAt.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Donor */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{tx.donorName}</p>
                      <p className="text-xs text-muted-foreground">{tx.donorEmail}</p>
                    </td>

                    {/* Request */}
                    <td className="px-5 py-4 hidden md:table-cell max-w-[200px]">
                      <p className="font-medium text-foreground truncate">{tx.requestTitle}</p>
                      {tx.requestCategory && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium uppercase">{tx.requestCategory}</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-primary text-base">
                        Rs. {Number(tx.amount).toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Method */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        {tx.paymentMethod === 'CARD_SIMULATED' ? 'Card (Simulated)' : tx.paymentMethod || '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {tx.requestId && (
                        <Link
                          to={`/donor/request/${tx.requestId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 border border-primary/20 hover:border-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer total */}
            {filtered.length > 0 && (
              <div className="px-5 py-3.5 border-t border-border bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} shown</span>
                <span className="text-sm font-bold text-primary">
                  Filtered Total: Rs. {filtered.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Firebase notice */}
      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live data from Firebase Firestore · <strong>donations</strong> collection
      </div>
    </DashboardLayout>
  );
}
