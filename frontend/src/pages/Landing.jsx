import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, FileText, ArrowRight, Shield, Users, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Intersection Observer for scroll reveals
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">Saviya <span className="font-normal text-muted-foreground text-base">| සවිය</span></span>
          </div>
          <nav className="hidden md:flex gap-8">
            {['How it Works', 'Verification', 'Privacy'].map((item, i) => (
              <a
                key={i}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group"
              >
                {item}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Log in</Link>
            <Link to="/register">
              <Button size="sm" className="btn-glow rounded-full px-5">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative py-28 lg:py-40 overflow-hidden">
          {/* Animated background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-float absolute top-16 left-[8%] w-72 h-72 bg-primary-200/40 rounded-full blur-3xl" />
            <div className="animate-float-slow absolute top-32 right-[6%] w-96 h-96 bg-primary-100/50 rounded-full blur-3xl" style={{animationDelay:'2s'}} />
            <div className="animate-float absolute bottom-12 left-[40%] w-64 h-64 bg-primary-300/20 rounded-full blur-3xl" style={{animationDelay:'4s'}} />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{backgroundImage:'linear-gradient(#16a34a 1px,transparent 1px),linear-gradient(90deg,#16a34a 1px,transparent 1px)', backgroundSize:'40px 40px'}} />
          </div>

          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
            <div className="animate-fade-in inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-green inline-block" />
              GN-Verified Community Assistance Platform
            </div>
            <h1 className="animate-fade-in-up delay-100 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
              Verified assistance.<br />
              <span className="text-gradient-green">Protected privacy.</span><br />
              Transparent support.
            </h1>
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Saviya connects Sri Lankan communities in need with donors through trusted Grama Niladhari (GN) verification — every step, privacy-first.
            </p>
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="btn-glow rounded-full px-8 text-base h-12">
                  Request Assistance <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 border-primary/30 text-primary hover:bg-primary/5">
                  Become a Donor
                </Button>
              </Link>
            </div>

            {/* Floating stat pills */}
            <div className="animate-fade-in delay-500 mt-16 flex flex-wrap justify-center gap-4">
              {[['100%','GN Verified'],['0','Data Leaks'],['5+','Districts'],['24/7','Audit']]
                .map(([val, label], i) => (
                  <div key={i} className="glass-card flex items-center gap-3 px-5 py-3 rounded-2xl">
                    <span className="text-2xl font-bold text-primary">{val}</span>
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="py-24 bg-primary/3">
          <div className="container mx-auto px-4 max-w-6xl">
            <RevealSection className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Simple Process</span>
              <h2 className="text-4xl font-bold mb-4">How Saviya Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">A seamless, secure bridge between those who need help and those who want to give.</p>
            </RevealSection>

            <div className="grid md:grid-cols-4 gap-6 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 rounded-full" />

              {[
                { icon: FileText,      step:'01', title:'Request',  desc:'Beneficiaries submit requests with supporting documents securely.' },
                { icon: ShieldCheck,   step:'02', title:'Verify',   desc:'GN Officers review and verify the legitimacy of each request.' },
                { icon: Lock,          step:'03', title:'Publish',  desc:'Verified requests are published with all private data protected.' },
                { icon: HeartHandshake,step:'04', title:'Support',  desc:'Donors choose verified causes and provide direct assistance.' },
              ].map(({ icon: Icon, step, title, desc }, i) => (
                <RevealSection key={i} className={`delay-${(i+1)*100} text-center`}>
                  <div className="card-hover relative flex flex-col items-center">
                    <div className="relative mb-5">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-primary/10 flex items-center justify-center mx-auto">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── GN Verification ── */}
        <section id="verification" className="py-24 bg-background border-y">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <RevealSection>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Trust & Legitimacy</span>
                <h2 className="text-4xl font-bold mb-6">Why GN Verification Matters</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  In many community assistance platforms, distinguishing genuine need from fraud is challenging. Saviya solves this by integrating the trusted Grama Niladhari (GN) network into every step of the workflow.
                </p>
                <ul className="space-y-5">
                  {[
                    ['Eliminates Fraud',    'Only GN-verified cases become visible to donors.'],
                    ['Local Knowledge',     'GNs have the contextual understanding to assess actual household conditions.'],
                    ['Full Accountability', 'Every verification decision is securely logged to the audit trail.'],
                  ].map(([title, desc], i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{title}</h4>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </RevealSection>

              <RevealSection className="delay-200">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/5 rounded-3xl" />
                  <div className="relative bg-white rounded-2xl shadow-lg border border-primary/10 p-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Grama Niladhari Portal</h3>
                        <p className="text-sm text-muted-foreground">Secure access for officials</p>
                      </div>
                      <span className="ml-auto flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />Live
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Authorized GN Officers log in to view assigned cases, review submitted evidence, and record official verification decisions — all tracked in the tamper-proof audit log.
                    </p>
                    <Link to="/login" className="block">
                      <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 rounded-xl">
                        GN Officer Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── For Beneficiaries & Donors ── */}
        <section className="py-24 bg-primary/3">
          <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'For Beneficiaries',
                desc:  'Request assistance with dignity. Saviya ensures your sensitive documents and personal identity remain completely hidden from the public and donors. Only authorized officials see your private information.',
                cta:   'Start a Request',
                color: 'from-primary-50 to-white',
                border:'border-primary-100',
              },
              {
                title: 'For Donors',
                desc:  'Give with confidence. Every case you see on Saviya has been vetted and verified by a local government official. Track exactly how your assistance creates real-world impact.',
                cta:   'Browse Verified Cases',
                color: 'from-primary-600 to-primary-700',
                border:'border-primary-500',
                dark:   true,
              },
            ].map(({ title, desc, cta, color, border, dark }, i) => (
              <RevealSection key={i} className={`delay-${i * 200}`}>
                <div className={`card-hover bg-gradient-to-br ${color} rounded-3xl p-10 border ${border} h-full flex flex-col`}>
                  <h3 className={`text-2xl font-bold mb-4 ${dark ? 'text-white' : ''}`}>{title}</h3>
                  <p className={`mb-8 leading-relaxed flex-1 ${dark ? 'text-primary-100' : 'text-muted-foreground'}`}>{desc}</p>
                  <Link to="/register" className={`inline-flex items-center font-semibold hover:gap-3 transition-all duration-200 gap-2 ${dark ? 'text-white' : 'text-primary'}`}>
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* ── Privacy ── */}
        <section id="privacy" className="py-24 bg-primary-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-800/30 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <RevealSection>
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="h-8 w-8 text-primary-300" />
              </div>
              <h2 className="text-4xl font-bold mb-6">Privacy is Our Priority</h2>
              <p className="text-lg text-primary-200 leading-relaxed mb-12 max-w-2xl mx-auto">
                We believe seeking help should never mean sacrificing your privacy. Beneficiary names, NIC numbers, and uploaded documents are strictly protected — donors only see the verified summary.
              </p>
            </RevealSection>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                ['Data Minimization',  'We only collect what is absolutely necessary for verification.'],
                ['Role-Based Access',  'Strict controls ensure users only see data appropriate for their role.'],
                ['Audit Trails',       'Important actions are logged securely to prevent any abuse.'],
              ].map(([title, desc], i) => (
                <RevealSection key={i} className={`delay-${(i+1)*100}`}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200">
                    <h4 className="font-bold mb-2 text-white">{title}</h4>
                    <p className="text-sm text-primary-200 leading-relaxed">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Banner ── */}
        <section className="py-16 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize:'24px 24px'}} />
          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[['100%','GN Verified'],['0','Data Leaks'],['5+','Districts'],['24/7','System Audit']]
                .map(([val, label], i) => (
                  <RevealSection key={i} className={`delay-${i*100}`}>
                    <div className="text-4xl font-extrabold text-white mb-1">{val}</div>
                    <div className="text-primary-100 text-sm font-medium">{label}</div>
                  </RevealSection>
                ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-background border-t py-10">
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
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms"   className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
