import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, CheckCircle2, TrendingUp, Sparkles, MapPin, DollarSign } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
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
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`} />;
}

// ── Case card ─────────────────────────────────────────────────────────────────
function CaseCard({ request, index }) {
  const urgencyColor = request.urgency === 'Critical'
    ? 'from-red-500 to-rose-600'
    : request.urgency === 'High'
    ? 'from-orange-500 to-amber-500'
    : 'from-primary to-primary-600';

  return (
    <div
      className="group bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
      style={{ animation: `fadeInUp 0.55s ease both ${index * 70}ms` }}
    >
      {/* Top gradient */}
      <div className={`h-1.5 bg-gradient-to-r ${urgencyColor}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            {request.category}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> GN Verified
          </span>
        </div>

        <h3 className="font-bold text-base text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
          {request.title}
        </h3>
        {request.locationSummary && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3" /> {request.locationSummary}
          </p>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
          {request.description}
        </p>

        {/* Amount + CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Funding goal</p>
              <p className="text-lg font-extrabold text-primary">Rs. {parseInt(request.requiredAmount || 0).toLocaleString()}</p>
            </div>
            {request.urgency === 'Critical' && (
              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg animate-pulse">URGENT</span>
            )}
          </div>
          <Link to={`/donor/request/${request.id}`} className="block">
            <button className="w-full btn-glow bg-primary text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 group-hover:bg-primary-700 transition-colors">
              <Heart className="h-4 w-4 fill-white/30" /> View & Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DonorDashboard() {
  const { userData } = useAuth();
  const [verifiedRequests, setVerifiedRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userData?.uid) return;
      try {
        const reqSnap = await getDocs(query(
          collection(db, 'assistanceRequests'),
          where('status', '==', 'VERIFIED'),
          where('visibility', '==', 'PUBLIC')
        ));
        const reqs = reqSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setVerifiedRequests(reqs);

        const donSnap = await getDocs(query(
          collection(db, 'donations'),
          where('donorId', '==', userData.uid)
        ));
        const dons = donSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setMyDonations(dons);
      } catch (err) {
        console.error('Error fetching donor data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  const totalDonated = myDonations.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <DashboardLayout roleTitle="Donor">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">Donor Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Welcome, <span className="text-gradient-green">{userData?.displayName?.split(' ')[0]}</span> ❤️
          </h1>
          <p className="text-muted-foreground mt-1">Your generosity changes lives — discover who needs your support today.</p>
        </div>
      </div>

      {/* ── Impact stats ── */}
      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {/* Hero impact card */}
        <div
          className="stat-card card-hover md:col-span-1 rounded-2xl p-6 shadow-lg overflow-hidden relative text-white"
          style={{ background: 'linear-gradient(135deg,#15803d 0%,#16a34a 50%,#4ade80 100%)', animation: 'fadeInUp 0.6s ease both 0ms' }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="text-primary-100 text-xs font-semibold uppercase tracking-wide mb-1">Your Total Impact</p>
            <p className="text-4xl font-extrabold mb-1">
              {loading ? '—' : <AnimatedNumber value={totalDonated} prefix="Rs. " />}
            </p>
            <p className="text-primary-200 text-sm">
              Across <span className="font-bold text-white">{myDonations.length}</span> verified {myDonations.length === 1 ? 'case' : 'cases'}
            </p>
          </div>
        </div>

        {/* Cases available */}
        <div
          className="stat-card card-hover bg-white border border-border rounded-2xl p-6 shadow-sm"
          style={{ animation: 'fadeInUp 0.6s ease both 80ms' }}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
          <div className="relative">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Verified Cases</p>
            <p className="text-4xl font-extrabold text-foreground">
              {loading ? '—' : <AnimatedNumber value={verifiedRequests.length} />}
            </p>
            <p className="text-xs text-muted-foreground mt-1">GN-approved, ready for support</p>
          </div>
        </div>

        {/* Donations made */}
        <div
          className="stat-card card-hover bg-white border border-border rounded-2xl p-6 shadow-sm"
          style={{ animation: 'fadeInUp 0.6s ease both 160ms' }}
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-50 rounded-full blur-xl" />
          <div className="relative">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Donations Made</p>
            <p className="text-4xl font-extrabold text-foreground">
              {loading ? '—' : <AnimatedNumber value={myDonations.length} />}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Thank you for giving!</p>
          </div>
        </div>
      </div>

      {/* ── Cases grid ── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Discover Verified Cases</h2>
        {verifiedRequests.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">{verifiedRequests.length} available</span>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : verifiedRequests.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5 animate-float">
            <Heart className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No active cases yet</h3>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            There are currently no verified requests needing funding. Please check back soon.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {verifiedRequests.map((req, i) => <CaseCard key={req.id} request={req} index={i} />)}
        </div>
      )}
    </DashboardLayout>
  );
}
