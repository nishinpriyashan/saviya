import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  ShieldCheck, ArrowRight, Sun, Moon, Heart, AlertTriangle, MapPin,
  ChevronLeft, ChevronRight, CheckCircle2, BadgeCheck, Lock, Users,
  TrendingUp, Sparkles, Star
} from 'lucide-react';
import { db } from '../firebase/config';
import { Button } from '../components/ui/Button';

// ── Images ───────────────────────────────────────────────────────────────────
import slide1 from '../assets/slideshow/Gemini_Generated_Image_h9s59ph9s59ph9s5.jpg';
import slide2 from '../assets/slideshow/Gemini_Generated_Image_j4dsirj4dsirj4ds.jpg';
import slide3 from '../assets/slideshow/Gemini_Generated_Image_shmq1ushmq1ushmq.jpg';
import slide4 from '../assets/slideshow/Gemini_Generated_Image_wr1n65wr1n65wr1n.jpg';

const SLIDES = [
  {
    src: slide1,
    headline: 'Verified Assistance for Sri Lankan Communities',
    sub: 'Every request is reviewed by a trusted Grama Niladhari Officer.',
    tag: 'Community First',
  },
  {
    src: slide2,
    headline: 'Transparent Giving, Protected Privacy',
    sub: 'Donors give with confidence. Beneficiary identities stay private.',
    tag: 'Privacy Protected',
  },
  {
    src: slide3,
    headline: 'GN-Verified. Admin-Approved. Donor-Funded.',
    sub: 'A three-layer verification system — no fraud, no guesswork.',
    tag: '3-Layer Verification',
  },
  {
    src: slide4,
    headline: 'Building Trust, One Community at a Time',
    sub: 'Connecting those who need help with those who want to give.',
    tag: 'Real Impact',
  },
];

// ── Dark mode ─────────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('saviya-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    const html = document.documentElement;
    dark ? html.classList.add('dark') : html.classList.remove('dark');
    localStorage.setItem('saviya-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

// ── Professional Slideshow ────────────────────────────────────────────────────
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState('next'); // 'next' | 'prev'
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const go = useCallback((idx, direction = 'next') => {
    if (animating) return;
    setAnimating(true);
    setDir(direction);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 600);
  }, [animating]);

  const next = useCallback(() => go((current + 1) % SLIDES.length, 'next'), [current, go]);
  const prev = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length, 'prev'), [current, go]);

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
      {/* All slides stacked — only current is visible */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current
              ? 'translateX(0) scale(1)'
              : animating && dir === 'next' && i === (current - 1 + SLIDES.length) % SLIDES.length
              ? 'translateX(-8%) scale(0.97)'
              : animating && dir === 'prev' && i === (current + 1) % SLIDES.length
              ? 'translateX(8%) scale(0.97)'
              : 'translateX(0) scale(1.02)',
            zIndex: i === current ? 2 : 1,
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <img
            src={s.src}
            alt={s.headline}
            className="w-full h-full object-cover"
            style={{ transform: i === current ? 'scale(1.04)' : 'scale(1)', transition: 'transform 6s ease' }}
          />
          {/* Multi-layer overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-16 md:pb-20 px-8 md:px-16 lg:px-24">
        {/* Tag pill */}
        <div
          key={`tag-${current}`}
          className="inline-flex items-center gap-2 bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full mb-5 w-fit backdrop-blur-sm border border-primary/30 animate-fade-in"
        >
          <Sparkles className="h-3 w-3" />
          {slide.tag}
        </div>

        {/* Headline */}
        <h1
          key={`headline-${current}`}
          className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-xl max-w-3xl leading-tight mb-4 animate-fade-in-up"
        >
          {slide.headline}
        </h1>

        {/* Sub */}
        <p
          key={`sub-${current}`}
          className="text-base md:text-xl text-white/80 max-w-xl mb-8 animate-fade-in-up delay-100"
        >
          {slide.sub}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-200">
          <Link to="/register">
            <Button size="lg" className="btn-glow rounded-full px-8 text-base h-12 shadow-2xl">
              Request Assistance <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base h-12 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all"
            >
              Become a Donor
            </Button>
          </Link>
        </div>

        {/* Dots + counter */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { go(i, i > current ? 'next' : 'prev'); resetTimer(); }}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-400 ${
                  i === current
                    ? 'w-10 h-2 bg-primary'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <span className="text-white/50 text-xs font-mono">
            {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Arrow buttons */}
      <button
        onClick={() => { prev(); resetTimer(); }}
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => { next(); resetTimer(); }}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        <div
          key={current}
          className="h-full bg-primary origin-left"
          style={{ animation: 'slideProgress 6s linear forwards' }}
        />
      </div>
    </div>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  return urgency === 'Critical' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
      <AlertTriangle className="h-3 w-3" /> Critical
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-sm">
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
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark] = useDarkMode();
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

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
        console.error('Failed to fetch urgent requests:', err);
      } finally {
        setLoadingReqs(false);
      }
    }
    fetchUrgent();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden transition-colors duration-300">

      {/* Progress bar keyframe — injected once */}
      <style>{`@keyframes slideProgress { from { width: 0%; } to { width: 100%; } }`}</style>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-sm transition-colors duration-300">
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

          {/* Nav — Home-specific anchors only; About page links open /about */}
          <nav className="hidden md:flex gap-7 items-center">
            {[
              { label: 'Home',           href: '#top' },
              { label: 'Urgent Cases',   href: '#urgent' },
              { label: 'Why Saviya',     href: '#why' },
              { label: 'About Us',       href: '/about', external: true },
            ].map(({ label, href, external }) =>
              external ? (
                <Link key={label} to={href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
                </Link>
              ) : (
                <a key={label} href={href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
                </a>
              )
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark/light mode"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-border transition-colors"
            >
              {dark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Log in</Link>
            <Link to="/register">
              <Button size="sm" className="btn-glow rounded-full px-5">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">

        {/* ── 1. HERO SLIDESHOW ── */}
        <section aria-label="Slideshow">
          <HeroSlideshow />
        </section>

        {/* ── 2. TRUST BAR ── */}
        <section className="py-5 border-b border-border bg-card shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { val: '100%', label: 'GN Verified Cases' },
                { val: '0',    label: 'Privacy Breaches' },
                { val: '5+',   label: 'Districts Active' },
                { val: '24/7', label: 'Audit Trail' },
                { val: '3',    label: 'Verification Layers' },
              ].map(({ val, label }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl font-extrabold text-primary">{val}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                  {i < 4 && <span className="hidden md:block w-px h-5 bg-border ml-3" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. URGENT CASES ── */}
        <section id="urgent" className="py-24 bg-background">
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
                    Every case below has been verified by a Grama Niladhari Officer and approved by the Saviya admin team. These families need immediate support.
                  </p>
                </div>
                <Link to="/login" className="shrink-0">
                  <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5 whitespace-nowrap">
                    View All Cases <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>

            {loadingReqs ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : urgentRequests.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold text-lg">No urgent cases at this moment.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  All active urgent cases have been addressed. <Link to="/login" className="text-primary hover:underline">Log in</Link> to see all verified cases.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {urgentRequests.map((req, i) => (
                  <Reveal key={req.id} className={`delay-${(i % 3 + 1) * 100}`}>
                    <div className="card-hover group bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full hover:border-primary/30 transition-colors duration-200">

                      {/* Colour-coded top stripe */}
                      <div className={`h-2 w-full ${req.urgency === 'Critical' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`} />

                      <div className="p-6 flex flex-col flex-1">
                        {/* Badges row */}
                        <div className="flex items-center justify-between mb-4">
                          <UrgencyBadge urgency={req.urgency} />
                          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg uppercase tracking-wide">{req.category}</span>
                        </div>

                        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{req.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">{req.description}</p>

                        {/* Footer row */}
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

                          {/* Verified badge */}
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/8 rounded-lg px-2.5 py-1.5">
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                            GN Verified · Admin Approved
                          </div>

                          <Link to="/login" className="block">
                            <Button className="w-full btn-glow rounded-xl gap-2 text-sm" size="sm">
                              <Heart className="h-4 w-4 fill-white/30" /> Donate Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 4. WHY SAVIYA (Trust builders) ── */}
        <section id="why" className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <Reveal className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Why Trust Saviya</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
                Built on <span className="text-gradient-green">Trust & Transparency</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base">
                Saviya is the only assistance platform in Sri Lanka that integrates the official Grama Niladhari network at every step.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  icon: ShieldCheck,
                  title: 'GN-Verified Every Time',
                  desc: 'Every request is visited and verified in person by a licensed Grama Niladhari Officer. Zero unverified cases ever reach donors.',
                  color: 'text-primary',
                  bg: 'bg-primary/10',
                },
                {
                  icon: Lock,
                  title: 'Privacy by Design',
                  desc: 'Beneficiary names, NIC numbers, addresses, and bank details are strictly private — donors only ever see the verified case summary.',
                  color: 'text-violet-600',
                  bg: 'bg-violet-50 dark:bg-violet-900/20',
                },
                {
                  icon: BadgeCheck,
                  title: 'Admin Final Approval',
                  desc: 'After GN verification, cases go through an additional admin review before being published — a three-layer check against fraud.',
                  color: 'text-blue-600',
                  bg: 'bg-blue-50 dark:bg-blue-900/20',
                },
                {
                  icon: TrendingUp,
                  title: 'Real-Time Audit Trail',
                  desc: 'Every action — from submission to donation — is logged in a tamper-proof audit trail. Full accountability at all times.',
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                },
                {
                  icon: Users,
                  title: 'Role-Based Access',
                  desc: 'Beneficiaries, GN Officers, Admins, and Donors each have separate, strictly controlled access levels. No role can overstep.',
                  color: 'text-amber-600',
                  bg: 'bg-amber-50 dark:bg-amber-900/20',
                },
                {
                  icon: Heart,
                  title: 'Dignity First',
                  desc: 'We believe asking for help should never feel humiliating. Saviya is designed to protect the dignity of every beneficiary.',
                  color: 'text-rose-600',
                  bg: 'bg-rose-50 dark:bg-rose-900/20',
                },
              ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                <Reveal key={i} className={`delay-${(i % 3 + 1) * 100}`}>
                  <div className="card-hover bg-card border border-border rounded-2xl p-6 h-full flex flex-col hover:border-primary/25 transition-colors shadow-sm">
                    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Who is it for — two feature cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="card-hover rounded-3xl p-10 border border-primary/20 bg-gradient-to-br from-primary-50 to-card h-full flex flex-col">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">For Beneficiaries</h3>
                  <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
                    Request assistance with complete dignity. Your NIC, address, bank details, and uploaded documents are strictly private — never visible to the public or donors.
                  </p>
                  <Link to="/register" className="inline-flex items-center font-semibold gap-2 text-primary hover:gap-3 transition-all duration-200">
                    Start a Request <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
              <Reveal className="delay-200">
                <div className="card-hover rounded-3xl p-10 border border-primary/40 bg-gradient-to-br from-primary-600 to-primary-800 h-full flex flex-col">
                  <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-5">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">For Donors</h3>
                  <p className="text-primary-100 leading-relaxed flex-1 mb-6">
                    Give with complete confidence. Every case is GN-verified and admin-approved. Your generosity reaches the right person through a bank transfer to their verified account.
                  </p>
                  <Link to="/register" className="inline-flex items-center font-semibold gap-2 text-white hover:gap-3 transition-all duration-200">
                    Browse Verified Cases <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 5. CTA BANNER ── */}
        <section className="py-24 bg-primary relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          {/* Glowing orbs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-primary-800/40 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
            <Reveal>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <Heart className="h-3.5 w-3.5 fill-white/50" />
                Join the Saviya Community
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                Ready to Make a Real Difference?
              </h2>
              <p className="text-primary-100 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
                Register as a Beneficiary to seek verified assistance, or as a Donor to support genuine cases in Sri Lankan communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-primary-50 rounded-full px-10 text-base h-13 font-bold shadow-xl transition-all hover:-translate-y-0.5">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="rounded-full px-10 text-base h-13 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all">
                    Learn How It Works
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-card border-t border-border py-10 transition-colors duration-300">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-muted-foreground">Saviya | සවිය</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Saviya Academic Prototype · All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/register/gn" className="text-sm text-muted-foreground hover:text-primary transition-colors">GN Registration</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
