import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  ShieldCheck, ArrowRight, Sun, Moon, Heart, AlertTriangle, MapPin,
  ChevronLeft, ChevronRight, BadgeCheck, Lock, Users, TrendingUp,
  Sparkles, Star, X, Eye, EyeOff, LogIn, FileText, HeartHandshake, CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db, auth } from '../firebase/config';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

// ── Images ───────────────────────────────────────────────────────────────────
import slide1 from '../assets/slideshow/Gemini_Generated_Image_h9s59ph9s59ph9s5.jpg';
import slide2 from '../assets/slideshow/Gemini_Generated_Image_j4dsirj4dsirj4ds.jpg';
import slide3 from '../assets/slideshow/Gemini_Generated_Image_shmq1ushmq1ushmq.jpg';
import slide4 from '../assets/slideshow/Gemini_Generated_Image_wr1n65wr1n65wr1n.jpg';

const SLIDES = [
  { src: slide1, headline: 'Verified Assistance for Sri Lankan Communities', sub: 'Every request is reviewed by a trusted Grama Niladhari Officer.', tag: 'Community First' },
  { src: slide2, headline: 'Transparent Giving, Protected Privacy',           sub: 'Donors give with confidence. Beneficiary identities stay private.',  tag: 'Privacy Protected' },
  { src: slide3, headline: 'GN-Verified. Admin-Approved. Donor-Funded.',       sub: 'A three-layer verification system — no fraud, no guesswork.',          tag: '3-Layer Verification' },
  { src: slide4, headline: 'Building Trust, One Community at a Time',          sub: 'Connecting those who need help with those who want to give.',           tag: 'Real Impact' },
];

// ── Dark mode ─────────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('saviya-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    dark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    localStorage.setItem('saviya-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const go = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 600);
  }, [animating]);

  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go]);
  const prev = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length), [current, go]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 6000);
  }, [next]);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full h-[580px] md:h-[700px] overflow-hidden bg-black">
      {/* Stacked slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'scale(1.04)' : 'scale(1)',
            transition: 'opacity 0.7s ease, transform 6s ease',
            zIndex: i === current ? 2 : 1,
          }}
        >
          <img src={s.src} alt={s.headline} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-16 md:pb-20 px-8 md:px-16 lg:px-24">
        <div key={`tag-${current}`} className="inline-flex items-center gap-2 bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 w-fit backdrop-blur-sm border border-primary/30 animate-fade-in">
          <Sparkles className="h-3 w-3" /> {slide.tag}
        </div>
        <h1 key={`h-${current}`} className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-xl max-w-3xl leading-tight mb-4 animate-fade-in-up">
          {slide.headline}
        </h1>
        <p key={`p-${current}`} className="text-base md:text-xl text-white/80 max-w-xl mb-8 animate-fade-in-up delay-100">
          {slide.sub}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-200">
          <Link to="/register">
            <Button size="lg" className="btn-glow rounded-full px-8 text-base h-12 shadow-2xl">
              Request Assistance <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#urgent">
            <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all">
              See Urgent Cases
            </Button>
          </a>
        </div>
        {/* Dots */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { go(i); resetTimer(); }} aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-400 ${i === current ? 'w-10 h-2 bg-primary' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
          <span className="text-white/50 text-xs font-mono">{String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => { prev(); resetTimer(); }} aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => { next(); resetTimer(); }} aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10 z-20">
        <div key={current} className="h-full bg-primary origin-left" style={{ animation: 'slideProgress 6s linear forwards' }} />
      </div>
    </div>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  return urgency === 'Critical' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
      <AlertTriangle className="h-3 w-3" /> Critical
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
      High Priority
    </span>
  );
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.classList.add('visible'); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

// ── Login Modal (centred, modern) ─────────────────────────────────────────────
function LoginPanel({ onClose }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) { toast.error('Account data not found. Contact support.'); setLoading(false); return; }
      const role = snap.data().role;
      onClose();
      switch (role) {
        case 'beneficiary': navigate('/beneficiary'); break;
        case 'donor':       navigate('/donor');       break;
        case 'gn':          navigate('/gn');          break;
        case 'admin':       navigate('/admin');       break;
        default:            navigate('/');
      }
      toast.success('Welcome back!');
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : 'Login failed. Please try again.';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Centred modal card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border overflow-hidden animate-fade-in-up">

          {/* ── Green branded header ── */}
          <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 px-8 pt-8 pb-10 text-center overflow-hidden">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* Logo mark */}
            <div className="relative w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>

            <h2 className="relative text-2xl font-extrabold text-white mb-1">Welcome Back</h2>
            <p className="relative text-primary-200 text-sm">Sign in to access your Saviya dashboard</p>
          </div>

          {/* ── Form body ── */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="modal-email" className="text-sm font-semibold text-foreground">
                Email Address
              </label>
              <input
                id="modal-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="modal-password" className="text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="modal-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 pr-11 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-70 btn-glow"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In to Dashboard
                </>
              )}
            </button>

            {/* Role guide */}
            <div className="rounded-2xl bg-muted/60 border border-border p-4">
              <p className="text-xs font-semibold text-foreground mb-2.5 text-center">You'll be taken to your dashboard based on your role</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { role: 'Beneficiary', desc: 'Submit requests' },
                  { role: 'Donor',       desc: 'Fund cases' },
                  { role: 'GN Officer',  desc: 'Verify cases' },
                  { role: 'Admin',       desc: 'Full management' },
                ].map(({ role, desc }) => (
                  <div key={role} className="flex items-center gap-1.5 bg-card rounded-xl px-2.5 py-2 border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-none">{role}</p>
                      <p className="text-xs text-muted-foreground leading-none mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* ── Footer ── */}
          <div className="px-8 pb-7 -mt-1 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" onClick={onClose} className="text-primary font-bold hover:underline">
                Register now
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              GN Officers:{' '}
              <Link to="/register/gn" onClick={onClose} className="text-primary hover:underline font-medium">
                register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [dark, setDark] = useDarkMode();
  const [loginOpen, setLoginOpen] = useState(false);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const { currentUser, userData } = useAuth();

  // Resolve dashboard path for the currently logged-in user
  const dashboardPath = (() => {
    switch (userData?.role) {
      case 'beneficiary': return '/beneficiary';
      case 'donor':       return '/donor';
      case 'gn':          return '/gn';
      case 'admin':       return '/admin';
      default:            return null;
    }
  })();

  // Fetch public urgent requests (no auth needed — Firestore rules updated)
  useEffect(() => {
    async function fetchUrgent() {
      if (!db) { setLoadingReqs(false); return; }
      try {
        const snap = await getDocs(
          query(
            collection(db, 'assistanceRequests'),
            where('visibility', '==', 'PUBLIC'),
            where('status', '==', 'VERIFIED')
          )
        );
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.urgency === 'Critical' || r.urgency === 'High')
          .sort((a, b) => ({ Critical: 0, High: 1 }[a.urgency] ?? 9) - ({ Critical: 0, High: 1 }[b.urgency] ?? 9))
          .slice(0, 6);
        setUrgentRequests(list);
      } catch (err) {
        console.error('Error fetching public requests:', err);
      } finally {
        setLoadingReqs(false);
      }
    }
    fetchUrgent();
  }, []);

  // Close login panel on Escape
  useEffect(() => {
    if (!loginOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setLoginOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loginOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden transition-colors duration-300">
      <style>{`@keyframes slideProgress { from { width: 0% } to { width: 100% } }`}</style>

      {/* ── LOGIN PANEL — only show if not already logged in ── */}
      {loginOpen && !currentUser && <LoginPanel onClose={() => setLoginOpen(false)} />}

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">
              Saviya <span className="font-normal text-muted-foreground text-sm">| සවිය</span>
            </span>
          </Link>

          {/* Centre nav — Home + How it Works only, both stay on this page */}
          <nav className="hidden md:flex gap-8 items-center">
            <a href="#top"
              className="text-sm font-semibold text-primary relative group">
              Home
              <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-primary rounded-full" />
            </a>
            <a href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
              How it Works
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
            </a>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Dark/Light */}
            <button onClick={() => setDark(d => !d)} aria-label="Toggle dark mode"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-border transition-colors">
              {dark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>

            {currentUser && dashboardPath ? (
              /* ── Already logged in — show dashboard shortcut ── */
              <Link to={dashboardPath}>
                <Button size="sm" className="btn-glow rounded-full px-5 gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  My Dashboard
                </Button>
              </Link>
            ) : (
              /* ── Not logged in — show login / get started ── */
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors px-1"
                >
                  Log in
                </button>
                <button onClick={() => setLoginOpen(true)}>
                  <Button size="sm" className="btn-glow rounded-full px-5">Get Started</Button>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">

        {/* ── 1. HERO SLIDESHOW ── */}
        <section aria-label="Hero slideshow">
          <HeroSlideshow />
        </section>

        {/* ── 2. TRUST STATS BAR ── */}
        <section className="py-5 border-b border-border bg-card shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
              {[
                { val: '100%', label: 'GN Verified Cases' },
                { val: '0',   label: 'Privacy Breaches' },
                { val: '5+',  label: 'Districts Active' },
                { val: '24/7',label: 'Audit Trail' },
                { val: '3',   label: 'Verification Layers' },
              ].map(({ val, label }, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-2xl font-extrabold text-primary">{val}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                  {i < 4 && <span className="hidden md:block w-px h-4 bg-border ml-2" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. URGENT CASES ── */}
        <section id="urgent" className="py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <Reveal className="mb-14">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/10 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    Live — Needs Urgent Support
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                    Urgent Cases <span className="text-gradient-green">Right Now</span>
                  </h2>
                  <p className="text-muted-foreground mt-3 max-w-lg text-base">
                    Every case below is GN-verified and admin-approved. These families need immediate support — no login required to view.
                  </p>
                </div>
                <button onClick={() => setLoginOpen(true)} className="shrink-0">
                  <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5 whitespace-nowrap">
                    Donate / Log In <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </button>
              </div>
            </Reveal>

            {loadingReqs ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : urgentRequests.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold text-lg">No urgent cases at this moment.</p>
                <p className="text-muted-foreground text-sm mt-2">All active urgent cases are currently funded. Check back soon.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {urgentRequests.map((req, i) => (
                  <Reveal key={req.id} className={`delay-${(i % 3 + 1) * 100}`}>
                    <div className="card-hover group bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full hover:border-primary/30 transition-colors duration-200">
                      <div className={`h-2 w-full ${req.urgency === 'Critical' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`} />
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <UrgencyBadge urgency={req.urgency} />
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg uppercase">{req.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{req.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">{req.description}</p>
                        <div className="mt-5 pt-4 border-t border-border space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{req.locationSummary || 'Sri Lanka'}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">Goal</p>
                              <p className="text-base font-bold text-primary">Rs. {parseInt(req.requiredAmount || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/8 rounded-lg px-2.5 py-1.5">
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0" /> GN Verified · Admin Approved
                          </div>
                          {currentUser && dashboardPath ? (
                            <Link to={dashboardPath} className="block">
                              <Button className="w-full btn-glow rounded-xl gap-2 text-sm" size="sm">
                                <Heart className="h-4 w-4 fill-white/30" /> Donate via Dashboard
                              </Button>
                            </Link>
                          ) : (
                            <button onClick={() => setLoginOpen(true)} className="w-full">
                              <Button className="w-full btn-glow rounded-xl gap-2 text-sm" size="sm">
                                <Heart className="h-4 w-4 fill-white/30" /> Donate Now
                              </Button>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 4. HOW IT WORKS (in-page, anchor scrolls here) ── */}
        <section id="how-it-works" className="py-24 bg-muted/40 border-y border-border scroll-mt-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <Reveal className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Simple Process</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">How Saviya Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A seamless, secure bridge between those who need help and those who want to give — verified every step of the way.
              </p>
            </Reveal>

            {/* Steps */}
            <div className="grid md:grid-cols-4 gap-6 relative mb-16">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 rounded-full" />
              {[
                { icon: FileText,       step: '01', title: 'Request',  desc: 'Beneficiaries submit requests with supporting documents. All data is kept strictly private.' },
                { icon: ShieldCheck,    step: '02', title: 'GN Review', desc: 'A Grama Niladhari Officer visits and verifies the case in person before approving.' },
                { icon: Lock,           step: '03', title: 'Publish',  desc: 'Admin reviews and publishes the case publicly — private data stays hidden from donors.' },
                { icon: HeartHandshake, step: '04', title: 'Support',  desc: 'Donors choose verified causes and donate. Funds go directly to the beneficiary\'s bank.' },
              ].map(({ icon: Icon, step, title, desc }, i) => (
                <Reveal key={i} className={`delay-${(i + 1) * 100} text-center`}>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-5">
                      <div className="w-20 h-20 bg-card rounded-2xl shadow-md border border-border flex items-center justify-center mx-auto">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2 text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Who is Saviya for — two cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="card-hover rounded-3xl p-9 border border-primary/20 bg-gradient-to-br from-primary-50 to-card h-full flex flex-col">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">For Beneficiaries</h3>
                  <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
                    Request assistance with complete dignity. Your NIC, address, bank details, and documents are strictly private — never visible to donors or the public.
                  </p>
                  <Link to="/register" className="inline-flex items-center font-semibold gap-2 text-primary hover:gap-3 transition-all duration-200">
                    Start a Request <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
              <Reveal className="delay-200">
                <div className="card-hover rounded-3xl p-9 border border-primary/40 bg-gradient-to-br from-primary-600 to-primary-800 h-full flex flex-col">
                  <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-5">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">For Donors</h3>
                  <p className="text-primary-100 leading-relaxed flex-1 mb-6">
                    Give with complete confidence. Every case is GN-verified and admin-approved. Your generosity reaches the right person via a secure bank transfer.
                  </p>
                  <button onClick={() => setLoginOpen(true)} className="inline-flex items-center font-semibold gap-2 text-white hover:gap-3 transition-all duration-200">
                    Browse Verified Cases <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 5. TRUST PILLARS ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <Reveal className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Why Trust Saviya</span>
              <h2 className="text-4xl font-extrabold text-foreground">Built on Trust &amp; Transparency</h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: 'GN-Verified Every Time', desc: 'Every request is personally visited and verified by a licensed Grama Niladhari Officer before reaching donors.', color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Lock,        title: 'Privacy by Design',       desc: 'Beneficiary names, NIC, address, and bank details are strictly private — donors only see the verified case summary.', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                { icon: TrendingUp,  title: 'Full Audit Trail',        desc: 'Every action from submission to donation is logged in a tamper-proof audit trail, ensuring complete accountability.', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                <Reveal key={i} className={`delay-${(i + 1) * 100}`}>
                  <div className="card-hover bg-card border border-border rounded-2xl p-7 h-full flex flex-col hover:border-primary/25 transition-colors shadow-sm">
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. CTA BANNER ── */}
        <section className="py-24 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-primary-800/40 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <Heart className="h-3.5 w-3.5 fill-white/50" /> Join the Saviya Community
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                Ready to Make a Real Difference?
              </h2>
              <p className="text-primary-100 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
                Register as a Beneficiary to seek verified assistance, or as a Donor to support genuine cases in Sri Lankan communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {currentUser && dashboardPath ? (
                  <Link to={dashboardPath}>
                    <button className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold text-base rounded-full px-10 h-12 shadow-xl hover:bg-green-50 hover:-translate-y-0.5 transition-all">
                      <LayoutDashboard className="h-5 w-5" /> Go to My Dashboard
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <button className="inline-flex items-center justify-center bg-white text-primary font-bold text-base rounded-full px-10 h-12 shadow-xl hover:bg-green-50 hover:-translate-y-0.5 transition-all">
                        Get Started Free
                      </button>
                    </Link>
                    <button
                      onClick={() => setLoginOpen(true)}
                      className="inline-flex items-center justify-center rounded-full px-10 text-base h-12 border border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold transition-all"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-card border-t border-border py-10 transition-colors duration-300">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg"><ShieldCheck className="h-4 w-4 text-primary" /></div>
            <span className="font-semibold text-muted-foreground">Saviya | සවිය</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Saviya Academic Prototype · All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/register/gn" className="text-sm text-muted-foreground hover:text-primary transition-colors">GN Registration</Link>
            <button onClick={() => setLoginOpen(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors">Log In</button>
            <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
