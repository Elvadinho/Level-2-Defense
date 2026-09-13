import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Clock,
  FolderKanban,
  CheckSquare,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  Bot,
  CheckCircle2,
  Star,
  ArrowUpRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ModooLogo } from '../components/common/ModooLogo';

/* ═══════ Odoo-style hand-drawn arrows ═══════ */
const HandDrawnArrowDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M30 5 C 28 15, 35 25, 32 40 C 29 55, 25 60, 28 75 C 31 90, 30 95, 30 105"
      stroke="#05AD98"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      strokeDasharray="4 2"
    />
    <path d="M24 95 L30 110 L36 95" stroke="#05AD98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const HandDrawnArrowRight: React.FC<{ className?: string; flip?: boolean }> = ({ className, flip }) => (
  <svg className={className} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path
      d="M10 60 C 30 55, 40 25, 60 20 C 80 15, 100 35, 120 25 C 140 15, 155 20, 175 30"
      stroke="#05AD98"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M165 20 L178 32 L165 38" stroke="#05AD98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const HandDrawnArrowCurve: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 75 C 35 70, 50 20, 80 15 C 110 10, 125 40, 145 35"
      stroke="#05AD98"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M135 25 L148 36 L135 42" stroke="#05AD98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* ═══════ Fade-in on scroll ═══════ */
const useFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

const FadeIn: React.FC<{ children: React.ReactNode; className?: string; delay?: string }> = ({ children, className = '', delay = '' }) => {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={delay ? { transitionDelay: delay } : undefined}
    >
      {children}
    </div>
  );
};

/* ═══════ Stat counter (triggers on scroll) ═══════ */
const StatCounter: React.FC<{ value: number; suffix?: string; label: string }> = ({ value, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const inc = value / 120;
      const timer = setInterval(() => {
        start += inc;
        if (start >= value) { setCount(value); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
      obs.disconnect();
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-black text-slate-900">{count}{suffix}</div>
      <div className="text-xs text-slate-500 font-semibold mt-1">{label}</div>
    </div>
  );
};

/* ═══════ Typing animation for hero ═══════ */
const useTyping = (words: string[], speed = 100, pause = 2000) => {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, charIdx + 1));
        if (charIdx + 1 === word.length) {
          setTimeout(() => setDeleting(true), pause);
        } else {
          setCharIdx(charIdx + 1);
        }
      } else {
        setText(word.slice(0, charIdx));
        if (charIdx === 0) {
          setDeleting(false);
          setWordIdx((wordIdx + 1) % words.length);
        } else {
          setCharIdx(charIdx - 1);
        }
      }
    }, deleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return text;
};

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const typedText = useTyping(['in one place.', 'effortlessly.', 'with Modoo.'], 80, 2500);

  const modules = [
    { icon: <Users className="w-5 h-5" />, name: 'Employees', desc: 'Directory & access roles' },
    { icon: <Clock className="w-5 h-5" />, name: 'Attendance', desc: 'QR check-in & GPS' },
    { icon: <FolderKanban className="w-5 h-5" />, name: 'Projects', desc: 'Milestones & resources' },
    { icon: <CheckSquare className="w-5 h-5" />, name: 'Tasks', desc: 'Kanban & collaboration' },
    { icon: <Building2 className="w-5 h-5" />, name: 'Customers', desc: 'CRM & relationships' },
    { icon: <FileText className="w-5 h-5" />, name: 'Quotations', desc: 'Estimates & proposals' },
    { icon: <Receipt className="w-5 h-5" />, name: 'Invoices', desc: 'Billing & payments' },
    { icon: <CreditCard className="w-5 h-5" />, name: 'Payments', desc: 'MoMo, Orange, Visa' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#05AD98]/20 overflow-x-hidden">

      {/* ═══════ NAVIGATION ═══════ */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ModooLogo size={34} />
            <span className="font-black text-xl tracking-tight text-slate-800">modoo</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#apps" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Apps</a>
            <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</a>
            <a href="#ai" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">AI</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-[#05AD98] transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="px-5 shadow-md shadow-[#05AD98]/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <img src="/images/modoo_hero_bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'radial-gradient(circle, #05AD98 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <FadeIn>
                <div className="flex items-center gap-2 mb-6 justify-center lg:justify-start">
                  <ModooLogo size={48} />
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-slate-900 leading-[1.08] mb-6">
                  Manage your<br />
                  entire business<br />
                  <span className="text-[#05AD98]">{typedText}</span>
                  <span className="animate-pulse text-[#05AD98]">|</span>
                </h1>
              </FadeIn>
              <FadeIn delay="100ms">
                <p className="text-lg text-slate-500 max-w-lg mb-8 leading-relaxed lg:mx-0 mx-auto">
                  HR, Projects, Invoicing, Payments and AI unified for modern African enterprises.
                </p>
              </FadeIn>
              <FadeIn delay="200ms">
                <div className="flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <Link to="/register">
                    <Button variant="primary" size="lg" className="px-8 shadow-xl shadow-[#05AD98]/20 hover:-translate-y-0.5 transition-all">
                      Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-[#05AD98] transition-colors flex items-center gap-1.5 py-3">
                    Sign in to your account <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </FadeIn>

              {/* Hand-drawn arrow pointing to the mockup */}
              <div className="hidden lg:block mt-4">
                <HandDrawnArrowRight className="w-44 h-16 ml-auto -mr-12 opacity-60" />
              </div>
            </div>

            {/* Right: Dashboard Mockup */}
            <FadeIn delay="300ms" className="flex-1 relative w-full max-w-xl lg:max-w-none">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-[#6ECFBF]/15 to-transparent rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
                  {/* Title bar */}
                  <div className="h-10 bg-slate-50 border-b border-slate-200/80 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                    <div className="ml-3 flex-1 max-w-[160px] h-5 bg-slate-100 rounded-md" />
                  </div>
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-40 border-r border-slate-100 p-2.5 space-y-1 hidden sm:block bg-[#FAFBFC]">
                      {['Dashboard', 'Employees', 'Attendance', 'Projects', 'Tasks'].map((item, i) => (
                        <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${i === 0 ? 'bg-[#05AD98] text-white' : 'text-slate-500'}`}>
                          <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-white/30' : 'bg-slate-200'}`} />
                          {item}
                        </div>
                      ))}
                      <div className="pt-1.5 mt-1 border-t border-slate-100">
                        {['Invoices', 'Payments', 'AI'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400">
                            <div className="w-3 h-3 rounded bg-slate-100" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-24 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-6 bg-[#05AD98] rounded-lg" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: '47', l: 'Employees', c: '#05AD98' },
                          { v: '12', l: 'Projects', c: '#3B82F6' },
                          { v: '₣4.2M', l: 'Revenue', c: '#F59E0B' },
                        ].map((k, i) => (
                          <div key={i} className="p-2 rounded-xl border border-slate-100">
                            <div className="w-5 h-1 rounded-full mb-1" style={{ backgroundColor: k.c, opacity: 0.5 }} />
                            <div className="text-xs font-black text-slate-900">{k.v}</div>
                            <div className="text-[8px] text-slate-400 font-medium">{k.l}</div>
                          </div>
                        ))}
                      </div>
                      <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 flex items-end px-3 pb-2 gap-1">
                        {[30, 50, 35, 70, 45, 85, 55, 75, 40, 65, 50, 80].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm bg-[#05AD98]" style={{ height: `${h}%`, opacity: 0.25 + h / 140 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ TRUSTED BY MARQUEE ═══════ */}
      <section className="py-5 bg-slate-50/80 border-y border-slate-200/40 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-12 text-sm font-semibold text-slate-400">
          {[...Array(2)].map((_, rep) => (
            <React.Fragment key={rep}>
              {['Employee Management', '•', 'QR Attendance', '•', 'Kanban Tasks', '•', 'CRM', '•', 'Invoicing', '•', 'Mobile Money', '•', 'AI Assistant', '•', 'RBAC', '•', 'GPS Geofencing', '•'].map((t, i) => (
                <span key={`${rep}-${i}`} className={t === '•' ? 'text-[#05AD98]/40' : ''}>{t}</span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCounter value={5} label="Countries" />
            <StatCounter value={8} label="Business Apps" />
            <StatCounter value={25} suffix="+" label="Companies" />
            <StatCounter value={99} suffix="%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Hand-drawn arrow bridging Stats → Apps */}
      <div className="flex justify-center -mt-4 -mb-4 relative z-10">
        <HandDrawnArrowDown className="w-10 h-20 opacity-50" />
      </div>

      {/* ═══════ APPS GRID ═══════ */}
      <section id="apps" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                A <span className="text-[#05AD98]">complete</span> suite of business apps.
              </h2>
              <p className="mt-3 text-slate-500 font-medium max-w-md mx-auto text-sm">
                Every tool you need, seamlessly integrated.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {modules.map((mod, idx) => (
              <FadeIn key={idx} delay={`${idx * 60}ms`}>
                <div className="group relative p-4 md:p-5 rounded-2xl border border-slate-200/80 bg-white hover:bg-[#FAFBFC] hover:border-[#05AD98]/30 hover:shadow-lg hover:shadow-[#05AD98]/[0.05] transition-all duration-300 cursor-pointer">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#05AD98]/8 flex items-center justify-center text-[#05AD98] group-hover:bg-[#05AD98] group-hover:text-white transition-all duration-300 mb-3">
                    {mod.icon}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-0.5">{mod.name}</h3>
                  <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURE: OPERATIONS ═══════ */}
      <section id="features" className="py-20 md:py-24 bg-[#FAFBFC] border-t border-slate-200/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <FadeIn className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#05AD98]/8 text-[#037667] text-[11px] font-bold uppercase tracking-wider mb-5 border border-[#05AD98]/12">
                <Users className="w-3.5 h-3.5" /> HR & Operations
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                Workforce management,<br />simplified.
              </h2>
              <p className="text-slate-500 mb-6 leading-relaxed max-w-md text-[15px]">
                From employee onboarding to QR attendance to agile Kanban boards.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  'Role-based access control',
                  'QR attendance + GPS geofencing',
                  'Drag-and-drop Kanban boards',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#05AD98] shrink-0" /> {item}
                  </div>
                ))}
              </div>
              {/* Arrow pointing to the mockup */}
              <HandDrawnArrowCurve className="hidden lg:block w-36 h-20 opacity-50 ml-16" />
            </FadeIn>

            <FadeIn delay="200ms" className="flex-1 relative w-full">
              <div className="absolute -inset-3 bg-[#05AD98]/5 rounded-3xl blur-xl" />
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                <div className="h-8 sm:h-9 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-2 text-[9px] font-medium text-slate-400">Tasks — Kanban</span>
                </div>
                <div className="p-2 sm:p-3 flex gap-2 bg-slate-50/50">
                  {['To Do', 'In Progress', 'Done'].map((col, ci) => (
                    <div key={ci} className="flex-1 bg-white border border-slate-100 rounded-xl p-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#94A3B8', '#3B82F6', '#05AD98'][ci] }} />
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{col}</span>
                      </div>
                      {Array.from({ length: 2 }).map((_, ti) => (
                        <div key={ti} className="p-1.5 sm:p-2 bg-white border border-slate-100 rounded-lg shadow-xs space-y-1">
                          <div className="w-full h-2 bg-slate-100 rounded" />
                          <div className="w-3/4 h-1.5 bg-slate-50 rounded" />
                          <div className="flex items-center justify-between">
                            <div className="w-4 h-4 rounded-full bg-slate-100" />
                            <div className="w-7 h-2 rounded-full" style={{ backgroundColor: ['#FEF3C7', '#DBEAFE', '#D1FAE5'][ci] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Hand-drawn arrow bridging Operations → Finance */}
      <div className="flex justify-center -mt-2 -mb-2 relative z-10">
        <HandDrawnArrowDown className="w-10 h-20 opacity-40" />
      </div>

      {/* ═══════ FEATURE: FINANCE ═══════ */}
      <section className="py-20 md:py-24 bg-white border-t border-slate-200/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            <FadeIn className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider mb-5 border border-amber-100/80">
                <BarChart3 className="w-3.5 h-3.5" /> Finance & Sales
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                From quote to cash,<br />in minutes.
              </h2>
              <p className="text-slate-500 mb-6 leading-relaxed max-w-md text-[15px]">
                Generate quotations, convert to invoices, collect via MTN MoMo or Orange Money.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  'Customer CRM & account linking',
                  'One-click Quote → Invoice',
                  'Mobile Money & card payments',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#05AD98] shrink-0" /> {item}
                  </div>
                ))}
              </div>
              {/* Arrow pointing back to the mockup */}
              <HandDrawnArrowCurve className="hidden lg:block w-36 h-20 opacity-50 ml-16 -scale-x-100" />
            </FadeIn>

            <FadeIn delay="200ms" className="flex-1 relative w-full">
              <div className="absolute -inset-3 bg-amber-50/40 rounded-3xl blur-xl" />
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
                <div className="h-8 sm:h-9 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-2 text-[9px] font-medium text-slate-400">Invoices — Overview</span>
                </div>
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="h-24 sm:h-28 bg-slate-50 rounded-xl border border-slate-100 flex items-end px-3 sm:px-4 pb-2 gap-1.5 sm:gap-2">
                    {[30, 50, 35, 70, 45, 85, 55, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 5 ? '#05AD98' : '#E2E8F0' }} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { n: 'TechCorp Cameroon', a: '₣ 2,450,000', s: 'Paid', sc: 'bg-emerald-50 text-emerald-700' },
                      { n: 'Douala Logistics', a: '₣ 890,000', s: 'Pending', sc: 'bg-amber-50 text-amber-700' },
                      { n: 'MediaPro Agency', a: '₣ 1,200,000', s: 'Paid', sc: 'bg-emerald-50 text-emerald-700' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-100 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-[#05AD98]">
                            {r.n.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-800">{r.n}</div>
                            <div className="text-[8px] sm:text-[9px] text-slate-400">{r.a}</div>
                          </div>
                        </div>
                        <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${r.sc}`}>{r.s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ AI ASSISTANT ═══════ */}
      <section id="ai" className="py-20 md:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <FadeIn className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-[#6ECFBF] text-[11px] font-bold uppercase tracking-wider mb-5 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Built-in AI
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                Your AI business<br />assistant.
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed max-w-md lg:mx-0 mx-auto text-[15px]">
                Query data, generate insights, and automate workflows through natural language.
              </p>
              <Link to="/register">
                <Button variant="primary" size="lg" className="bg-[#05AD98] hover:bg-[#049381] border-none px-8 shadow-xl shadow-[#05AD98]/20">
                  Try AI Assistant <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </FadeIn>

            <FadeIn delay="200ms" className="flex-1 w-full max-w-sm md:max-w-md">
              <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-[#05AD98] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Modoo AI</div>
                    <div className="text-[10px] text-emerald-400 font-medium">● Online</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#05AD98]/20 shrink-0 flex items-center justify-center mt-0.5">
                      <Bot className="w-3 h-3 text-[#05AD98]" />
                    </div>
                    <div className="bg-white/[0.06] rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-slate-300">
                      How can I help you today?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-[#05AD98] rounded-xl rounded-tr-sm px-3 py-2 text-[13px] text-white">
                      How many employees were late this week?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#05AD98]/20 shrink-0 flex items-center justify-center mt-0.5">
                      <Bot className="w-3 h-3 text-[#05AD98]" />
                    </div>
                    <div className="bg-white/[0.06] rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-slate-300">
                      <strong className="text-white">3 employees</strong> were late. Want me to send reminders?
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex-1 h-8 bg-white/[0.04] rounded-lg border border-white/[0.06] px-3 text-[11px] text-slate-500 flex items-center">Ask anything...</div>
                  <div className="w-8 h-8 rounded-lg bg-[#05AD98] flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIAL ═══════ */}
      <section className="py-16 md:py-20 bg-[#FAFBFC] border-t border-slate-200/40">
        <FadeIn>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-0.5 mb-5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <blockquote className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 leading-relaxed mb-5 px-4">
              "Modoo transformed how we manage our 50+ employees across Douala and Yaoundé. The QR attendance alone saved us 15 hours per month."
            </blockquote>
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#05AD98] flex items-center justify-center text-white font-bold text-xs">
                ME
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Marc Ekwalla</div>
                <div className="text-xs text-slate-500">CEO, TechCorp Cameroon</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-16 md:py-20 bg-[#05AD98] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 50%)',
        }} />
        <div className="max-w-2xl mx-auto px-4 relative z-10">
          <FadeIn>
            <ModooLogo size={48} className="mx-auto mb-6 opacity-80" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 tracking-tight">Ready to streamline your business?</h2>
            <p className="text-white/70 mb-8 font-medium text-sm sm:text-base">
              Get started in minutes. No credit card required.
            </p>
            <Link to="/register">
              <Button variant="outline" size="lg" className="bg-white text-[#05AD98] border-white hover:bg-white/90 px-8 font-bold shadow-xl hover:-translate-y-0.5 transition-all">
                Create free account <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white border-t border-slate-200/60 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ModooLogo size={24} />
            <span className="font-bold text-sm text-slate-800 tracking-tight">modoo</span>
          </div>
          <div className="flex gap-6 text-xs font-medium text-slate-400">
            <Link to="#" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link to="#" className="hover:text-slate-600 transition-colors">API</Link>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Modoo Enterprises
          </p>
        </div>
      </footer>

      {/* ═══════ MARQUEE ANIMATION KEYFRAMES ═══════ */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
