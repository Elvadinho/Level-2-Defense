import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  PlayCircle,
  Shield,
  Zap,
  Globe,
  Star,
} from 'lucide-react';
import { Button } from '../components/common/Button';

/* ───────── SVG Swoop Arrows ───────── */
const SwoopArrow1: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 80 C 40 20, 100 20, 140 60" stroke="#05AD98" strokeWidth="2.5" strokeLinecap="round" fill="transparent" />
    <path d="M125 45 L 140 60 L 120 70" stroke="#05AD98" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
  </svg>
);

const SwoopArrow2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M140 80 C 110 20, 50 20, 10 60" stroke="#05AD98" strokeWidth="2.5" strokeLinecap="round" fill="transparent" />
    <path d="M25 45 L 10 60 L 30 70" stroke="#05AD98" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
  </svg>
);

/* ───────── Animated Counter Hook ───────── */
const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

export const LandingPage: React.FC = () => {

  const modules = [
    { icon: <Users className="w-6 h-6" />, name: 'Employees', desc: 'Centralized directory and access rights management across departments.' },
    { icon: <Clock className="w-6 h-6" />, name: 'Attendance', desc: 'Time tracking with secure QR code and GPS geofencing verification.' },
    { icon: <FolderKanban className="w-6 h-6" />, name: 'Projects', desc: 'Resource allocation, milestones, and project lifecycle tracking.' },
    { icon: <CheckSquare className="w-6 h-6" />, name: 'Tasks', desc: 'Kanban boards with drag-and-drop, custom stages, and comments.' },
    { icon: <Building2 className="w-6 h-6" />, name: 'Customers', desc: 'Comprehensive CRM with contact management and account linking.' },
    { icon: <FileText className="w-6 h-6" />, name: 'Quotations', desc: 'Professional estimates with line items and one-click conversion.' },
    { icon: <Receipt className="w-6 h-6" />, name: 'Invoices', desc: 'Automated billing, reconciliation, and payment status tracking.' },
    { icon: <CreditCard className="w-6 h-6" />, name: 'Payments', desc: 'MTN Mobile Money, Orange Money, and Visa/Card integrations.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#05AD98]/20 selection:text-[#037667] overflow-x-hidden">
      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#05AD98] to-[#038577] flex items-center justify-center shadow-lg shadow-[#05AD98]/25">
              <span className="text-white font-black text-lg leading-none">M</span>
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">Modoo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#apps" className="text-sm font-semibold text-slate-600 hover:text-[#05AD98] transition-colors">Apps</a>
            <a href="#operations" className="text-sm font-semibold text-slate-600 hover:text-[#05AD98] transition-colors">Features</a>
            <a href="#ai" className="text-sm font-semibold text-slate-600 hover:text-[#05AD98] transition-colors">AI Assistant</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-[#05AD98] transition-colors">
              Sign in
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" className="px-5 shadow-lg shadow-[#05AD98]/25 hover:shadow-xl hover:shadow-[#05AD98]/30 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section 
        className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/modoo_hero_bg.jpg')" }}
      >
        {/* Subtle white overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/70" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05AD98]/10 text-[#037667] text-xs font-bold uppercase tracking-wider mb-6 border border-[#05AD98]/15">
                <Zap className="w-3.5 h-3.5" /> Open-Source ERP for Africa
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black tracking-tight text-slate-900 mb-6 leading-[1.08]">
                Manage your<br />
                entire business<br />
                <span className="bg-gradient-to-r from-[#05AD98] to-[#038577] bg-clip-text text-transparent">in one place.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-xl mb-8 leading-relaxed font-medium">
                Modoo unifies HR, Projects, Sales, Invoicing and AI Assistance into one seamless platform designed for modern companies.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 lg:justify-start justify-center">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="px-8 text-base shadow-xl shadow-[#05AD98]/20 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#05AD98]/30 transition-all">
                    Start your free trial <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="px-8 text-base bg-white border-slate-300 hover:border-[#05AD98] transition-all">
                    <PlayCircle className="w-5 h-5 mr-2 text-[#05AD98]" /> Live Demo
                  </Button>
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-500 font-medium flex items-center gap-4 lg:justify-start justify-center">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-[#05AD98]" /> Free forever</span>
                <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-[#05AD98]" /> No credit card</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4 text-[#05AD98]" /> Open source</span>
              </p>
            </div>

            {/* Right: Rich UI Mockup */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
              <div className="relative">
                {/* Shadow behind mockup */}
                <div className="absolute inset-4 bg-[#05AD98]/10 rounded-3xl blur-2xl" />
                {/* Main Window */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
                  {/* Title bar */}
                  <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <div className="ml-4 flex-1 h-5 bg-slate-200/60 rounded-md max-w-[200px]" />
                  </div>
                  {/* Mockup content */}
                  <div className="flex">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-slate-100 p-3 space-y-2 hidden sm:block bg-slate-50/50">
                      {['Dashboard', 'Employees', 'Attendance', 'Projects', 'Tasks'].map((item, i) => (
                        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${i === 0 ? 'bg-[#05AD98] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                          <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-white/30' : 'bg-slate-200'}`} />
                          {item}
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        {['Invoices', 'Payments', 'AI Assistant'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500">
                            <div className="w-4 h-4 rounded bg-slate-200" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Content area */}
                    <div className="flex-1 p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="w-28 h-4 bg-slate-200 rounded-md" />
                          <div className="w-48 h-3 bg-slate-100 rounded-sm" />
                        </div>
                        <div className="w-24 h-8 bg-[#05AD98] rounded-lg" />
                      </div>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Employees', val: '47', color: 'bg-[#05AD98]' },
                          { label: 'Projects', val: '12', color: 'bg-blue-500' },
                          { label: 'Revenue', val: '₣4.2M', color: 'bg-amber-500' },
                        ].map((kpi, i) => (
                          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white">
                            <div className={`w-8 h-1.5 ${kpi.color} rounded-full mb-2 opacity-60`} />
                            <div className="text-base font-black text-slate-900">{kpi.val}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{kpi.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Chart area */}
                      <div className="h-28 bg-slate-50 rounded-xl border border-slate-100 flex items-end px-4 pb-3 gap-2">
                        {[35, 55, 40, 75, 50, 90, 60, 85, 45, 70, 55, 80].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm bg-[#05AD98]" style={{ height: `${h}%`, opacity: 0.3 + (h / 130) }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF STRIP ═══════════ */}
      <section className="py-16 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCounter value={5} suffix="" label="Countries" />
            <StatCounter value={8} suffix="" label="Business Apps" />
            <StatCounter value={25} suffix="+" label="Companies" />
            <StatCounter value={99.9} suffix="%" label="Uptime SLA" decimal />
          </div>
        </div>
      </section>

      {/* ═══════════ APPS GRID ═══════════ */}
      <section id="apps" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Everything you need with a <span className="text-[#05AD98]">top-notch</span> user experience.
            </h2>
            <p className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              Our integrated suite of applications covers every aspect of your business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                className="group relative p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#05AD98]/40 hover:shadow-xl hover:shadow-[#05AD98]/[0.07] transition-all duration-300 cursor-pointer flex flex-col text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#05AD98]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#05AD98]/[0.06] transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-[#05AD98] group-hover:from-[#05AD98] group-hover:to-[#038577] group-hover:text-white transition-all duration-300 mb-5 shadow-sm">
                    {mod.icon}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{mod.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURE 1: OPERATIONS ═══════════ */}
      <section id="operations" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-left relative">
              <SwoopArrow2 className="absolute hidden lg:block w-24 h-24 right-0 -top-8 -rotate-6 opacity-80" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05AD98]/10 text-[#037667] text-xs font-bold uppercase tracking-wider mb-6 border border-[#05AD98]/15">
                <Users className="w-4 h-4" /> HR & Operations
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                Align your workforce<br />with strategic objectives.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                Streamline employee onboarding, manage precise attendance records via QR verification, and transform abstract projects into actionable Kanban workflows.
              </p>
              <ul className="space-y-4">
                {[
                  { text: 'Role-Based Access Control matrix', sub: 'Admin, HR, PM, Employee, Accountant, Customer' },
                  { text: 'QR Code Attendance with GPS geofencing', sub: 'Camera scan + location verification' },
                  { text: 'Drag-and-drop Kanban with custom stages', sub: 'Agile workflow management' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#05AD98] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-900 font-semibold">{item.text}</span>
                      <span className="block text-sm text-slate-500">{item.sub}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Mockup */}
            <div className="flex-1 relative w-full">
              <div className="absolute inset-4 bg-[#05AD98]/5 rounded-3xl blur-xl" />
              <div className="relative aspect-[4/3] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-[10px] font-semibold text-slate-400">modoo.cm / tasks</span>
                </div>
                <div className="flex-1 p-4 flex gap-3 bg-slate-50/50">
                  {['To Do', 'In Progress', 'Done'].map((col, ci) => (
                    <div key={ci} className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#64748B', '#3B82F6', '#05AD98'][ci] }} />
                        <span className="text-[11px] font-bold text-slate-700">{col}</span>
                        <span className="text-[10px] ml-auto bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-500">{[3, 2, 4][ci]}</span>
                      </div>
                      {Array.from({ length: [3, 2, 4][ci] }).map((_, ti) => (
                        <div key={ti} className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-2 shadow-xs">
                          <div className="w-full h-2.5 bg-slate-100 rounded-sm" />
                          <div className="w-3/4 h-2 bg-slate-50 rounded-sm" />
                          <div className="flex items-center justify-between pt-1">
                            <div className="w-5 h-5 rounded-full bg-slate-100" />
                            <div className="w-10 h-3 rounded-full" style={{ backgroundColor: ['#FEF3C7', '#DBEAFE', '#D1FAE5'][ci] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURE 2: FINANCE ═══════════ */}
      <section className="py-24 bg-white relative overflow-hidden border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 text-left relative">
              <SwoopArrow1 className="absolute hidden lg:block w-32 h-32 -left-12 -top-16 rotate-[20deg] opacity-80" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6 border border-amber-100">
                <CreditCard className="w-4 h-4" /> Finance & Sales
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                From quote to cash,<br />in minutes not days.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                Maintain a centralized customer registry. Generate professional quotations instantly, convert them to invoices, and reconcile payments through Mobile Money.
              </p>
              <ul className="space-y-4">
                {[
                  { text: 'Unified Customer Relationship database', sub: 'Company profiles linked to user accounts' },
                  { text: 'One-click Quote → Invoice conversion', sub: 'Automated line-item transfer' },
                  { text: 'MTN MoMo & Orange Money processing', sub: 'Integrated NotchPay gateway' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#05AD98] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-900 font-semibold">{item.text}</span>
                      <span className="block text-sm text-slate-500">{item.sub}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Mockup */}
            <div className="flex-1 relative w-full">
              <div className="absolute inset-4 bg-amber-100/20 rounded-3xl blur-xl" />
              <div className="relative aspect-[4/3] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-[10px] font-semibold text-slate-400">modoo.cm / invoices</span>
                </div>
                <div className="flex-1 p-4 space-y-4">
                  {/* Chart */}
                  <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-end px-5 pb-3 gap-3">
                    {[35, 55, 40, 75, 50, 90, 60, 85].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, backgroundColor: i === 5 ? '#05AD98' : '#05AD9840' }} />
                    ))}
                  </div>
                  {/* Table rows */}
                  <div className="space-y-2.5">
                    {[
                      { name: 'TechCorp Cameroon', amount: '₣ 2,450,000', status: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
                      { name: 'Douala Logistics', amount: '₣ 890,000', status: 'Pending', color: 'bg-amber-50 text-amber-700' },
                      { name: 'MediaPro Agency', amount: '₣ 1,200,000', status: 'Paid', color: 'bg-emerald-50 text-emerald-700' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-[#05AD98]">
                            {row.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{row.name}</div>
                            <div className="text-[10px] text-slate-500">{row.amount}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.color}`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ AI ASSISTANT ═══════════ */}
      <section id="ai" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Removed colorful gradients, kept it dark flat professional */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-6 border border-white/10 shadow-2xl">
                <Bot className="w-7 h-7 text-[#05AD98]" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                Meet your AI<br />Business Assistant.
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed font-medium max-w-lg">
                Execute complex operations conversationally. Authorize transactions, query employee attendance, and generate business insights using natural language.
              </p>
              <Link to="/register">
                <Button variant="primary" size="lg" className="bg-[#05AD98] hover:bg-[#049381] border-none px-8 shadow-xl shadow-[#05AD98]/30 hover:-translate-y-1 transition-all">
                  Try AI Assistant <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            {/* Chat mockup */}
            <div className="flex-1 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-[#05AD98] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Modoo AI</div>
                    <div className="text-[10px] text-emerald-300 font-medium">● Online</div>
                  </div>
                </div>
                {/* Messages */}
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#05AD98]/20 shrink-0 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-[#05AD98]" />
                    </div>
                    <div className="bg-white/10 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-[85%]">
                      Good morning! How can I help you today?
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <div className="bg-[#05AD98] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-[85%]">
                      How many employees were late this week?
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#05AD98]/20 shrink-0 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-[#05AD98]" />
                    </div>
                    <div className="bg-white/10 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-[85%]">
                      This week, <strong className="text-white">3 employees</strong> were marked as late: David M. (Mon), Carine E. (Tue), and Junior F. (Thu). Would you like me to send them a reminder?
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <div className="flex-1 h-9 bg-white/5 rounded-lg border border-white/10" />
                  <div className="w-9 h-9 rounded-lg bg-[#05AD98] flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIAL / TRUST ═══════════ */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed mb-6 italic">
            "Modoo transformed how we manage our 50+ employees across Douala and Yaoundé. The QR attendance system alone saved us 15 hours per month in manual tracking."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#05AD98] flex items-center justify-center text-white font-bold text-sm">
              ME
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">Marc Ekwalla</div>
              <div className="text-xs text-slate-500">CEO, TechCorp Cameroon</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 bg-gradient-to-br from-[#05AD98] to-[#038577] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Ready to get started?</h2>
          <p className="text-lg text-white/80 mb-8 font-medium">
            Join thousands of companies already using Modoo to streamline their operations.
          </p>
          <Link to="/register">
            <Button variant="outline" size="lg" className="bg-white text-[#05AD98] border-white hover:bg-white/90 px-8 font-bold shadow-xl hover:-translate-y-0.5 transition-all">
              Create your free account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#05AD98] to-[#038577] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs leading-none">M</span>
              </div>
              <span className="font-black text-slate-900 tracking-tight">Modoo ERP</span>
            </div>
            <div className="flex gap-8 text-sm font-semibold text-slate-500">
              <Link to="#" className="hover:text-[#05AD98] transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-[#05AD98] transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-[#05AD98] transition-colors">Developer API</Link>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              © {new Date().getFullYear()} Modoo Enterprises. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ───────── Stat Counter Sub-component ───────── */
const StatCounter: React.FC<{ value: number; suffix: string; label: string; decimal?: boolean }> = ({ value, suffix, label, decimal }) => {
  const count = useCounter(decimal ? Math.floor(value) : value);
  return (
    <div>
      <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
        {decimal ? `${count}.${String(value).split('.')[1] || '0'}` : count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-500 font-semibold mt-1">{label}</div>
    </div>
  );
};

export default LandingPage;
