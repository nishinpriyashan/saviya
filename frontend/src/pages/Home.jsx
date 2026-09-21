import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  ShieldCheck, ArrowRight, Sun, Moon, Heart, AlertTriangle, MapPin,
  ChevronLeft, ChevronRight, HeartHandshake, FileText, Lock, CheckCircle2,
  Shield, Users
} from 'lucide-react';
import { db } from '../firebase/config';
import { Button } from '../components/ui/Button';

// ── Images ───────────────────────────────────────────────────────────────────
import slide1 from '../assets/slideshow/Gemini_Generated_Image_h9s59ph9s59ph9s5.jpg';
import slide2 from '../assets/slideshow/Gemini_Generated_Image_j4dsirj4dsirj4ds.jpg';
import slide3 from '../assets/slideshow/Gemini_Generated_Image_shmq1ushmq1ushmq.jpg';
import slide4 from '../assets/slideshow/Gemini_Generated_Image_wr1n65wr1n65wr1n.jpg';

const SLIDES = [
  { src: slide1, caption: 'Verified Assistance for Sri Lankan Communities' },
  { src: slide2, caption: 'Transparent Giving, Protected Privacy' },
  { src: slide3, caption: 'GN-Verified. Admin-Approved. Donor-Funded.' },
  { src: slide4, caption: 'Building Trust, One Community at a Time' },
];

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('saviya-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (dark) { html.classList.add('dark'); } else { html.classList.remove('dark'); }
    localStorage.setItem('saviya-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 400);
  }, []);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const resetTimer = () => { clearInterval(timerRef.current); timerRef.current = setInterval(next, 5000); };

  return (
    <div className="relative w-full h-[520px] md:h-[640px] overflow-hidden rounded-none">
      {/* Slide image */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        <img
          src={SLIDES[current].src}
          alt={SLIDES[current].caption}
          className="w-full h-full object-cover slide-ken-burns"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Caption */}
      <div className="absolute bottom-0 inset-x-0 p-8 md:p-14 z-10">
        <p
          key={current}
          className="text-white text-2xl md:text-4xl font-extrabold drop-shadow-lg max-w-3xl animate-fade-in-up"
        >
          {SLIDES[current].caption}
        </p>
        {/* Dots */}
        <div className="flex gap-2.5 mt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resetTimer(); }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-4 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arrow controls */}
      <button
        onClick={() => { prev(); resetTimer(); }}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => { next(); resetTimer(); }}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  return urgency === 'Critical' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
      <AlertTriangle className="h-3 w-3" /> Critical
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
      High Priority
    </span>
  );
}

// ── Intersection reveal hook ──────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.12 }
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

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark] = useDarkMode();
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  // Fetch High + Critical verified requests visible to public
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
          .sort((a, b) => {
            const order = { Critical: 0, High: 1 };
            return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
          })
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

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">
              Saviya <span className="font-normal text-muted-foreground text-base">| සවිය</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex gap-7">
            {[
              { label: 'Home', to: '/' },
              { label: 'How it Works', to: '/about#how-it-works' },
              { label: 'Verification', to: '/about#verification' },
              { label: 'Privacy', to: '/about#privacy' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark mode"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-border transition-colors"
            >
              {dark
                ? <Sun className="h-4 w-4 text-yellow-400" />
                : <Moon className="h-4 w-4 text-muted-foreground" />
              }
            </button>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Log in
            </Link>
            <Link to="/register">
              <Button size="sm" className="btn-glow rounded-full px-5">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero Slideshow ── */}
        <section className="relative">
          <HeroSlideshow />
          {/* Overlay CTA on top of slideshow */}
          <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16 z-20 pointer-events-none">
            <div className="animate-fade-in inline-flex items-center gap-2 bg-primary/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/20 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-green inline-block" />
              GN-Verified Community Assistance Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-xl max-w-2xl leading-tight animate-fade-in-up delay-100">
              Verified assistance.<br />
              <span className="text-gradient-green">Protected privacy.</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pointer-events-auto animate-fade-in-up delay-200">
              <Link to="/register">
                <Button size="lg" className="btn-glow rounded-full px-8 text-base h-12 shadow-xl">
                  Request Assistance <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20">
                  Become a Donor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="py-6 border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center md:justify-between gap-8 text-center">
              {[
                ['100%', 'GN Verified'],
                ['0', 'Data Leaks'],
                ['5+', 'Districts Covered'],
                ['24/7', 'Audit Logging'],
              ].map(([val, label], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-primary">{val}</span>
                  <span className="text-sm text-muted-foreground text-left">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Urgent Requests ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <Reveal className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Live Cases</span>
              <h2 className="text-4xl font-extrabold mb-3 text-foreground">Urgent Needs Right Now</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                These verified cases have been approved by GN Officers and the Admin panel — every case is real, privacy-protected, and needs your support.
              </p>
            </Reveal>

            {loadingReqs ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : urgentRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">No urgent cases right now.</p>
                <p className="text-muted-foreground text-sm mt-1">Check back soon or browse all verified cases after logging in.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {urgentRequests.map((req, i) => (
                  <Reveal key={req.id} className={`delay-${(i % 3 + 1) * 100}`}>
                    <div className="card-hover group bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
                      {/* Urgency stripe */}
                      <div className={`h-1.5 w-full ${req.urgency === 'Critical' ? 'bg-red-500' : 'bg-orange-400'}`} />
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <UrgencyBadge urgency={req.urgency} />
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{req.category}</span>
                        </div>
                        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">{req.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">{req.description}</p>
                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{req.locationSummary || 'Sri Lanka'}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Goal</p>
                            <p className="text-base font-bold text-primary">Rs. {parseInt(req.requiredAmount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <Link to="/login" className="mt-4 block">
                          <Button className="w-full btn-glow rounded-xl gap-2" size="sm">
                            <Heart className="h-4 w-4" /> Donate Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}

            <div className="text-center mt-10">
              <Link to="/login">
                <Button variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5">
                  View All Verified Cases <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works (mini) ── */}
        <section className="py-20 bg-muted/40 border-y border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <Reveal className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Simple Process</span>
              <h2 className="text-4xl font-bold text-foreground">How Saviya Works</h2>
            </Reveal>
            <div className="grid md:grid-cols-4 gap-6 relative">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 rounded-full" />
              {[
                { icon: FileText, step: '01', title: 'Request', desc: 'Beneficiaries submit requests with supporting documents.' },
                { icon: ShieldCheck, step: '02', title: 'Verify', desc: 'GN Officers review and verify each request in person.' },
                { icon: Lock, step: '03', title: 'Publish', desc: 'Admin approves — private data stays protected.' },
                { icon: HeartHandshake, step: '04', title: 'Support', desc: 'Donors give directly to verified cases.' },
              ].map(({ icon: Icon, step, title, desc }, i) => (
                <Reveal key={i} className={`delay-${(i + 1) * 100} text-center`}>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-5">
                      <div className="w-20 h-20 bg-card rounded-2xl shadow-md border border-border flex items-center justify-center mx-auto">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                    </div>
                    <h3 className="text-base font-bold mb-1 text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/about">
                <Button variant="outline" className="rounded-full px-7 border-primary/30 text-primary hover:bg-primary/5">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Who is Saviya for ── */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'For Beneficiaries',
                desc: 'Request assistance with full privacy. Your sensitive documents and personal identity remain completely hidden from the public and donors.',
                cta: 'Start a Request',
                to: '/register',
                dark: false,
              },
              {
                title: 'For Donors',
                desc: 'Give with full confidence. Every case on Saviya has been verified by a local Grama Niladhari officer and approved by our admin team.',
                cta: 'Browse Verified Cases',
                to: '/register',
                dark: true,
              },
            ].map(({ title, desc, cta, to, dark }, i) => (
              <Reveal key={i} className={`delay-${i * 200}`}>
                <div className={`card-hover rounded-3xl p-10 border h-full flex flex-col ${
                  dark
                    ? 'bg-gradient-to-br from-primary-600 to-primary-800 border-primary-500 text-white'
                    : 'bg-gradient-to-br from-primary-50 to-card border-primary-100'
                }`}>
                  <h3 className={`text-2xl font-bold mb-4 ${dark ? 'text-white' : 'text-foreground'}`}>{title}</h3>
                  <p className={`mb-8 leading-relaxed flex-1 ${dark ? 'text-primary-100' : 'text-muted-foreground'}`}>{desc}</p>
                  <Link to={to} className={`inline-flex items-center font-semibold gap-2 hover:gap-3 transition-all duration-200 ${dark ? 'text-white' : 'text-primary'}`}>
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
            <Reveal>
              <Heart className="h-10 w-10 text-white mx-auto mb-5 fill-white/30" />
              <h2 className="text-4xl font-extrabold text-white mb-4">Ready to Make a Difference?</h2>
              <p className="text-primary-100 mb-8 text-lg">
                Join thousands of Sri Lankans helping verified families through Saviya.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-primary-50 rounded-full px-10 text-base h-12 font-bold shadow-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="rounded-full px-10 text-base h-12 border-white/40 text-white hover:bg-white/10">
                    Learn More
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
            © {new Date().getFullYear()} Saviya Academic Prototype. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/register/gn" className="text-sm text-muted-foreground hover:text-primary transition-colors">GN Registration</Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
