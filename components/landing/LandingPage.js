import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Database,
  Workflow,
  Building2,
  LineChart,
  FolderKanban,
  ShoppingCart,
  Users,
  Boxes,
  Truck,
  Globe,
  BarChart3,
  AlertTriangle,
  Lock,
  Check,
  ChevronDown,
  Unplug,
  Droplets,
  Timer,
  FileWarning,
  Landmark,
  CreditCard,
  BellRing,
  CalendarClock,
  FileUp,
  Wallet,
  Quote,
  Zap,
  Flame,
  Mountain,
  Atom,
  Leaf,
  ShieldAlert,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Motion presets (matching epcstack-tm-clone)                         */
/* ------------------------------------------------------------------ */

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] },
});

const reveal = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] },
};

function SectionHead({ eyebrow, title, sub, center = false, dark = false }) {
  return (
    <motion.div {...reveal} className={`${center ? "mx-auto text-center" : ""} mb-14 max-w-3xl`}>
      <div
        className={`${center ? "epcora-eyebrow-center" : "epcora-eyebrow"} mb-5 ${
          dark ? "!text-[#FCBC45]" : ""
        }`}
      >
        {eyebrow}
      </div>
      <h2
        className={`${
          center ? "" : "epcora-bordered-heading "
        }font-display text-3xl font-bold leading-snug sm:text-4xl ${
          dark ? "!text-white" : "!text-[#074E84]"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/75" : "text-[#505E6B]"}`}>
          {sub}
        </p>
      )}
      {center && <div className="mx-auto mt-6 h-1 w-16 bg-[#FCBC45]" />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter & FlipWord                                         */
/* ------------------------------------------------------------------ */

function Counter({ to, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / 1600, 1);
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

const ROTATING_WORDS = [
  "Projects",
  "Purchase Orders",
  "Vendors",
  "Materials",
  "Deliveries",
  "Assets",
];

function FlipWord({ word }) {
  return (
    <span className="relative inline-block h-[1.3em] min-w-[8ch] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block whitespace-nowrap font-bold text-[#FCBC45]"
        >
          {word}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Static Content & Data                                               */
/* ------------------------------------------------------------------ */

const HERO_STATS = [
  { value: 8, suffix: "", label: "Integrated EPC Modules" },
  { value: 6, suffix: "", label: "PO Schedule Dimensions" },
  { value: 51, suffix: "+", label: "Active Vendors & Masters" },
  { value: 100, suffix: "%", label: "Read-Only Audited AI" },
];

const TICKER_ITEMS = [
  "WBS & Network Controls",
  "Purchase Order Tracking",
  "Six-Dimension Expediting",
  "Vendor Prequalification & Evaluation",
  "Material Standardization & Stock",
  "Bank Guarantee & LC Watch",
  "QR Asset Intelligence",
  "Read-Only AI DB Agent",
  "Lessons Learnt Register",
];

const PAINS = [
  {
    icon: Unplug,
    title: "Siloed ERP & Spreadsheets",
    desc: "SAP, Tally, and Primavera P6 hold raw records while expediting, vendor docs, and site tracking live in scattered spreadsheets that never agree.",
  },
  {
    icon: Droplets,
    title: "Post-PO Blind Spots",
    desc: "Once a purchase order is issued, design approvals, ITP witness tests, bank guarantees, and customs clearances slip silently until site work stalls.",
  },
  {
    icon: Timer,
    title: "Unstandardized Materials",
    desc: "Duplicate material descriptions, inconsistent group mappings, and fragmented plant stock hide surplus inventory across projects.",
  },
  {
    icon: FileWarning,
    title: "Slow Executive Reporting",
    desc: "Answering a simple question about open PO commitments, vendor compliance, or overdue deliveries takes hours of manual VLOOKUPs.",
  },
];

const IMPACTS = [
  [
    "Post-PO expediting drift",
    "Lapsed ABG / PBG cover & delayed milestone releases",
    "Critical-path equipment arriving weeks behind site schedule",
  ],
  [
    "Disconnected ERP & field logs",
    "Re-keying PR, PO & delivery status across multiple trackers",
    "Decisions made on stale weekly exports instead of live status",
  ],
  [
    "Fragmented vendor documentation",
    "Missing compliance certificates & untracked vendor feedback",
    "Repeat awards to underperforming suppliers without audit trails",
  ],
  [
    "Duplicate & unmapped materials",
    "Procurement of stock already sitting idle in special stock",
    "Inflated working capital and inconsistent ERP material masters",
  ],
];

const WORKFLOW_STEPS = [
  {
    icon: Database,
    step: "01",
    title: "Ingest",
    desc: "Load SAP, Tally, or Excel extracts via the Data Load engine — mapping WBS elements, networks, PO lines, vendors, and stock automatically.",
  },
  {
    icon: Workflow,
    step: "02",
    title: "Unify",
    desc: "Engineering, procurement, expediting, and warehouse teams work from one live workspace across Projects, POs, Vendors, and Materials.",
  },
  {
    icon: CalendarClock,
    step: "03",
    title: "Expedite",
    desc: "Track all six post-PO dimensions — design, inspection, payments/BG/LC, fabrication progress, shipping, and site delivery — with full comment trails.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Ask & Control",
    desc: "Use executive dashboards or ask the read-only AI DB Agent in plain English to generate validated MongoDB aggregations, tables, and charts.",
  },
];

const GOVERNANCE_CARDS = [
  {
    icon: Lock,
    title: "Read-Only AI DB Agent",
    desc: "Strictly enforced in code — only Find, Aggregate, Count, and Distinct queries can run. Zero mutations, ever.",
    a: "#074E84",
  },
  {
    icon: ShieldCheck,
    title: "Two-Step Query Verification",
    desc: "Every natural-language prompt is schema-validated and verified before execution, returning executive summaries and charts.",
    a: "#2380C6",
  },
  {
    icon: Landmark,
    title: "BG & LC Expiry Watch",
    desc: "Advance Bank Guarantees, Performance Bank Guarantees, and Letters of Credit are monitored across every open PO.",
    a: "#E8A020",
  },
  {
    icon: Building2,
    title: "Non-Intrusive ERP Layer",
    desc: "Works harmoniously on top of SAP, Tally, and Excel exports without costly ERP customizations or lock-in.",
    a: "#0E9F8A",
  },
];

const MODULES = [
  {
    icon: FolderKanban,
    title: "Projects & WBS Control",
    tagline: "WBS · Networks · Long-Lead Packages",
    desc: "End-to-end visibility into project hierarchies, network schedules, long-lead procurement packages, and project document registers.",
    href: "/projectsdashboard",
    a: "#074E84",
    points: [
      "WBS elements, project networks & purchase timelines",
      "Long-lead package tracking from enquiry to site arrival",
      "Centralized project document dashboard & revision control",
    ],
  },
  {
    icon: ShoppingCart,
    title: "Purchase Orders & Schedules",
    tagline: "Every PO · Every Schedule · Every Alert",
    desc: "Search, inspect, and expedite open and historical purchase orders with six-dimension schedule tracking and automated alert reports.",
    href: "/purchaseordersdashboard",
    a: "#2380C6",
    points: [
      "Real-time PO search, line-item drilldown & schedule views",
      "Bank guarantee (ABG/PBG) and Letter of Credit alert tracking",
      "Structured PO comments, vendor feedback & recovery actions",
    ],
  },
  {
    icon: Users,
    title: "Vendor Ecosystem",
    tagline: "Master · Evaluation · AI Extraction",
    desc: "Manage SAP and Non-SAP vendors, qualification documents, group mappings, structured evaluations, and AI-assisted vendor profile extraction.",
    href: "/vendorsdashboard",
    a: "#D64550",
    points: [
      "Unified SAP & Non-SAP vendor master with group mapping",
      "Document upload, compliance view & missing-doc exception reports",
      "Web-format vendor evaluation scoring & AI vendor extract",
    ],
  },
  {
    icon: Boxes,
    title: "Materials & Stock Intelligence",
    tagline: "Standardization · Complete & Special Stock",
    desc: "Standardize material descriptions, browse material groups and types, and monitor complete plant stock alongside project special stock.",
    href: "/materialsdashboard",
    a: "#0E9F8A",
    points: [
      "AI-ready material standardization & group classification",
      "Complete stock & special stock visibility across plants",
      "Material documents & historical movement traceability",
    ],
  },
  {
    icon: Truck,
    title: "Field & Logistics Tracking",
    tagline: "PR · PO · Delivery · Post-Delivery",
    desc: "Structured digital tracking forms that bridge procurement and site receiving — from purchase requisition through post-delivery inspection.",
    href: "/trackingdashboard",
    a: "#B45309",
    points: [
      "Dedicated PR, PO, Delivery & Post-Delivery workflow forms",
      "End-to-end milestone checkpoints between office and site",
      "Exception capture for short shipments, damages & returns",
    ],
  },
  {
    icon: Globe,
    title: "Assets & Global Masters",
    tagline: "MME Equipment · Fixed Assets · QR Lookup",
    desc: "Track Measuring & Monitoring Equipment (MME), fixed assets, public QR asset tags, and enterprise-wide global master data.",
    href: "/assetdashboard",
    a: "#7C5CD6",
    points: [
      "MME calibration & fixed asset register with QR public view",
      "Enterprise global masters & structured ERP data load center",
      "Instant scan-to-verify asset status for field engineers",
    ],
  },
  {
    icon: BarChart3,
    title: "Executive Reports & Lessons",
    tagline: "Purchases · Compliance · Lessons Learnt",
    desc: "Decision-ready reports covering purchase analytics, PO alert summaries, vendor documentation gaps, and institutional lessons learnt.",
    href: "/reportsdashboard",
    a: "#0A1B33",
    points: [
      "Purchases analytics & overdue PO alert executive summaries",
      "Vendor compliance reports (POs with missing docs, no-PO vendors)",
      "Searchable Lessons Learnt knowledge base for EPC teams",
    ],
  },
  {
    icon: Sparkles,
    title: "Read-Only AI DB Agent",
    tagline: "Plain English · Instant Charts · 100% Safe",
    desc: "Ask questions in plain English against your live EPC database — two-step validated, strictly read-only, with instant charts and tables.",
    href: "/db-agent",
    a: "#E8A020",
    points: [
      "Translates natural language into verified MongoDB aggregations",
      "Generates interactive bar, line & pie charts with executive briefs",
      "Hard-locked to read-only operations (Find, Aggregate, Count, Distinct)",
    ],
  },
];

const INDUSTRIES = [
  {
    icon: Building2,
    name: "Construction & EPC",
    img: "/images/epcora/products/smartproject/project-1.jpg",
    desc: "Deep WBS structures, long-lead package control, and multi-discipline procurement on complex builds.",
  },
  {
    icon: Leaf,
    name: "Infrastructure & Utilities",
    img: "/images/epcora/products/smartproject/project-2.jpg",
    desc: "High-governance vendor management, guarantee tracking, and material control for public-scale programs.",
  },
  {
    icon: Flame,
    name: "Oil, Gas & Petrochemicals",
    img: "/images/epcora/products/smartproject/project-3.jpg",
    desc: "Strict ITP inspection monitoring, MME calibration compliance, and certified vendor documentation.",
  },
  {
    icon: Zap,
    name: "Power & Industrial Turnarounds",
    img: "/images/epcora/products/smartproject/hero-construction.png",
    desc: "Zero-slippage expediting and special-stock visibility where every hour of shutdown counts.",
  },
];

const INDUSTRY_LIST = [
  { icon: Zap, name: "Power Generation & Utilities" },
  { icon: Flame, name: "Oil & Gas Upstream & Midstream" },
  { icon: Mountain, name: "Refineries, Metals & Mining" },
  { icon: Atom, name: "Petrochemicals & Process Plants" },
  { icon: Leaf, name: "Infrastructure & Green Energy" },
  { icon: Building2, name: "Commercial & Industrial EPC" },
];

const ROI_METRICS = [
  {
    value: "Zero",
    label: "Silent PO Delays",
    note: "Six-dimension schedule tracking and BG/LC alerts surface bottlenecks weeks before contractual delivery.",
  },
  {
    value: "100%",
    label: "Read-Only AI Safety",
    note: "Every executive and engineer can query live project data in plain English without risk of data mutation.",
  },
  {
    value: "One",
    label: "Unified EPC Portal",
    note: "Projects, POs, vendors, materials, assets, tracking, and reports working from a single source of truth.",
  },
  {
    value: "Days",
    label: "From ERP Export to Live",
    note: "Plug in SAP, Tally, or Excel extracts and launch your command center without a multi-quarter rollout.",
  },
];

const ONBOARD_STEPS = [
  {
    icon: FileUp,
    step: "Step 1",
    title: "Load Your SAP / Excel Extracts",
    desc: "Use the built-in Data Load module to ingest WBS elements, networks, vendors, materials, and open purchase orders.",
  },
  {
    icon: Wallet,
    step: "Step 2",
    title: "Map Vendors & Material Groups",
    desc: "Standardize material descriptions, link vendor group mappings, and upload compliance certificates in one pass.",
  },
  {
    icon: CalendarClock,
    step: "Step 3",
    title: "Activate Six-Dimension PO Tracking",
    desc: "Monitor design approvals, ITPs, payments/guarantees, fabrication, shipping, and site delivery with live alert reports.",
  },
  {
    icon: LineChart,
    step: "Step 4",
    title: "Launch Dashboards & AI DB Agent",
    desc: "Give project controls, procurement, and leadership instant dashboards and plain-English AI analytics.",
  },
];

const FAQS = [
  {
    q: "How does Optaimyze connect with our existing SAP, Tally, or Excel data?",
    a: "Optaimyze is designed to work seamlessly alongside your existing ERP. Using the built-in Data Load & Global Masters modules, you can import structured extracts from SAP, Tally, Primavera P6, or Excel—immediately populating Projects, WBS Elements, Networks, Purchase Orders, Vendors, and Material Stock without complex ERP customization.",
  },
  {
    q: "Is the AI DB Agent safe to use on production project and procurement data?",
    a: "Yes. The AI DB Agent is strictly read-only at the code and driver execution layer. It only permits read operations (Find, Aggregate, Count, and Distinct) against whitelisted collections, uses two-step query verification, and can never insert, modify, or delete records.",
  },
  {
    q: "What does six-dimension PO expediting cover?",
    a: "For every open Purchase Order, the portal tracks Design Submissions & Approvals, Inspection & Test Plans (ITP), Payments / Bank Guarantees (ABG/PBG) / Letters of Credit (LC), Manufacturing Progress, Shipping & Customs Clearance, and Site Delivery & Returns—backed by a chronological comment and follow-up trail.",
  },
  {
    q: "Can we manage both SAP and Non-SAP vendors in the same portal?",
    a: "Yes. The Vendors module supports both ERP-registered SAP vendors and Non-SAP vendors, complete with document uploads, group mappings, vendor feedback logs, AI-assisted profile extraction, and web-format performance evaluations.",
  },
  {
    q: "How are materials and site assets tracked?",
    a: "The Materials module provides complete plant stock, special project stock, material group/type hierarchies, and standardization workflows. The Assets module tracks Measuring & Monitoring Equipment (MME) and Fixed Assets with QR-enabled public verification pages.",
  },
];

/* ------------------------------------------------------------------ */
/*  Hero Interactive Mockup (EPC Command Center)                        */
/* ------------------------------------------------------------------ */

const HERO_PO_MILES = [
  { code: "WBS 1.1", label: "Substructure & Piling Package · PO-4510082", state: "done", tag: "Delivered" },
  { code: "WBS 2.1", label: "Centrifugal Pump Skid · ITP Witness Test (8/12)", state: "now", tag: "In Inspection" },
  { code: "WBS 2.4", label: "HV Switchgear Panels · ABG Valid · PBG 19d", state: "now", tag: "BG Watch" },
  { code: "WBS 3.2", label: "Piping & Valves Lot B · Customs & Dispatch", state: "next", tag: "Scheduled" },
];

function HeroCommandMock() {
  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#0A1B33] shadow-[0_24px_60px_-16px_rgba(7,78,132,0.45)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FCBC45]/80" />
        <span className="ml-3 font-display text-[10px] font-semibold uppercase tracking-widest text-white/55">
          EPCORA · Optaimyze EPC Command Center
        </span>
      </div>

      <div className="p-5">
        {/* Top KPI strip */}
        <div className="mb-4 grid grid-cols-3 gap-2.5">
          {[
            { k: "Open PO Value", v: "SAR 4.2M", c: "text-[#FCBC45]" },
            { k: "Active Vendors", v: "51 Verified", c: "text-emerald-400" },
            { k: "Stock Accuracy", v: "98.4%", c: "text-[#2380C6]" },
          ].map((item) => (
            <div key={item.k} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <div className="font-display text-[9px] font-bold uppercase tracking-wider text-white/45">
                {item.k}
              </div>
              <div className={`mt-0.5 font-display text-sm font-extrabold ${item.c}`}>{item.v}</div>
            </div>
          ))}
        </div>

        {/* Module pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["Projects & WBS", "PO Schedule", "Vendors", "Materials", "AI DB Agent"].map((tab, idx) => (
            <span
              key={tab}
              className={`rounded-full px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-wide ${
                idx === 1
                  ? "bg-[#FCBC45] text-[#05052D]"
                  : "border border-white/15 bg-white/5 text-white/60"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Live WBS & PO rows */}
        <div className="space-y-2">
          {HERO_PO_MILES.map((m, idx) => (
            <motion.div
              key={m.code}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.12, duration: 0.45 }}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[11px] ${
                m.state === "now"
                  ? "border-[#FCBC45]/60 bg-[#FCBC45]/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2 text-white/85">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    m.state === "done"
                      ? "bg-emerald-400"
                      : m.state === "now"
                      ? "pulse-dot bg-[#FCBC45]"
                      : "bg-white/30"
                  }`}
                />
                <span className="font-mono text-[10px] font-bold text-[#FCBC45]">{m.code}</span>
                <span className="truncate">{m.label}</span>
              </div>
              <span
                className={`shrink-0 font-display text-[10px] font-bold uppercase ${
                  m.state === "now" ? "text-[#FCBC45]" : "text-white/50"
                }`}
              >
                {m.tag}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Footer status bar inside mockup */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/55">
          <span className="flex items-center gap-1.5">
            <Landmark size={11} className="text-[#FCBC45]" /> ABG/PBG &amp; LC monitored live
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={11} className="text-emerald-400" /> AI DB Agent: Read-Only
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Showcase Mockups (Section 6)                                        */
/* ------------------------------------------------------------------ */

const WBS_NODES = [
  { depth: 0, code: "PRJ-EPC-01", name: "Desalination & Power Interconnect EPC", budget: "SAR 42.0M", tag: "PROJECT" },
  { depth: 1, code: "WBS 1.0", name: "Civil & Marine Intake Works", budget: "SAR 11.4M", tag: "NETWORK" },
  { depth: 2, code: "PKG-104", name: "HDPE Intake Piping & Offshore Valves", budget: "SAR 3.8M", tag: "LONG LEAD", highlight: true },
  { depth: 1, code: "WBS 2.0", name: "Mechanical & Pumping Island", budget: "SAR 18.6M", tag: "NETWORK" },
  { depth: 2, code: "PKG-208", name: "High-Pressure Centrifugal Pump Skids", budget: "SAR 6.4M", tag: "LONG LEAD", highlight: true },
  { depth: 2, code: "PKG-212", name: "Duplex Stainless Manifold Assemblies", budget: "SAR 2.9M", tag: "PO ISSUED" },
];

function WbsPackagesShowcase() {
  return (
    <div className="bg-white p-6 shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-[#2380C6]">
            Projects · WBS &amp; Long-Lead Packages
          </div>
          <h4 className="mt-2 font-display text-xl font-bold text-[#074E84]">
            Every WBS node linked to packages &amp; PO timelines
          </h4>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#0A1B33] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-[#FCBC45]">
          <Lock size={10} /> ERP Synced
        </span>
      </div>

      <div className="mt-5 space-y-1.5">
        {WBS_NODES.map((n) => (
          <div
            key={n.code}
            className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-[13px] ${
              n.highlight
                ? "border-[#FCBC45]/60 bg-[#FCBC45]/10"
                : "border-[#E7E3F5] bg-[#F6F4FF]/60"
            }`}
            style={{ marginLeft: `${n.depth * 20}px` }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold text-[#2380C6]">{n.code}</span>
              <span className="truncate font-medium text-[#0A1B33]">{n.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="font-display text-xs font-bold text-[#074E84]">{n.budget}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wide ${
                  n.highlight
                    ? "bg-[#FCBC45] text-[#05052D]"
                    : "bg-[#074E84]/10 text-[#074E84]"
                }`}
              >
                {n.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-[#E7E3F5] pt-4 text-[11px] text-[#505E6B]/80">
        Drill from project networks and WBS elements straight into long-lead packages, engineering documents, and purchase timelines.
      </p>
    </div>
  );
}

const ALERT_ROWS = [
  { po: "PO-4510082", vendor: "FlowServe Gulf FZE", inst: "PBG", status: "19 days left", tone: "amber" },
  { po: "PO-4510117", vendor: "AlFanar Electricals", inst: "ABG", status: "Action Logged", tone: "red" },
  { po: "PO-4509964", vendor: "Meridian Piping Co.", inst: "LC", status: "26 days left", tone: "amber" },
  { po: "PO-4510203", vendor: "Gulf Valves & Controls", inst: "PBG", status: "Valid · Active", tone: "green" },
];

const BADGE_TONE = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-700",
};

function ExpediteGuaranteeShowcase() {
  return (
    <div className="bg-white p-6 shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-[#2380C6]">
            Purchase Orders · Six-Dimension Expediting &amp; Alerts
          </div>
          <h4 className="mt-2 font-display text-xl font-bold text-[#074E84]">
            Schedules, guarantees &amp; LCs watched on every open PO
          </h4>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-red-700">
          <BellRing size={11} /> 2 Need Action
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#E7E3F5] font-display text-[10px] font-bold uppercase tracking-wider text-[#505E6B]">
              <th className="py-2 pr-3">PO Number</th>
              <th className="py-2 pr-3">Vendor</th>
              <th className="py-2 pr-3">Instrument</th>
              <th className="py-2">Watch Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3F5]/70 text-[#505E6B]">
            {ALERT_ROWS.map((r) => (
              <tr key={r.po}>
                <td className="py-2.5 pr-3 font-semibold text-[#074E84]">{r.po}</td>
                <td className="py-2.5 pr-3">{r.vendor}</td>
                <td className="py-2.5 pr-3 font-medium text-[#0A1B33]">
                  <span className="flex items-center gap-1.5">
                    {r.inst === "LC" ? (
                      <CreditCard size={12} className="text-[#2380C6]" />
                    ) : (
                      <Landmark size={12} className="text-[#E8A020]" />
                    )}
                    {r.inst}
                  </span>
                </td>
                <td className="py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-display text-[9px] font-bold uppercase ${BADGE_TONE[r.tone]}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 border border-[#E7E3F5] bg-[#0A1B33] p-4">
        <div className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest text-[#FCBC45]">
          <ShieldAlert size={12} /> Six Schedule Dimensions · Comment Trail Attached
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">
          Design Approvals · ITP Inspections · Payments/BG/LC · Fabrication Progress · Customs/Shipping · Site Delivery.
        </p>
      </div>

      <p className="mt-4 border-t border-[#E7E3F5] pt-4 text-[11px] text-[#505E6B]/80">
        Every PO carries its own schedule workspace and comment history so nothing lapses between procurement and site.
      </p>
    </div>
  );
}

function AiDbAgentShowcase() {
  const sampleBars = [
    { label: "FlowServe Gulf", val: 88, amount: "SAR 1.42M" },
    { label: "AlFanar Elec.", val: 72, amount: "SAR 1.15M" },
    { label: "Meridian Piping", val: 58, amount: "SAR 0.91M" },
    { label: "Gulf Valves", val: 44, amount: "SAR 0.68M" },
  ];

  return (
    <div className="bg-white p-6 shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-[#2380C6]">
            Read-Only AI DB Agent · Two-Step Verified
          </div>
          <h4 className="mt-2 font-display text-xl font-bold text-[#074E84]">
            Ask your EPC database in plain English — get charts &amp; executive briefs
          </h4>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          <Sparkles size={11} /> Find · Aggregate · Count · Distinct Only
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 text-[13px] leading-relaxed text-[#505E6B]">
          <div className="border border-[#E7E3F5] bg-[#F6F4FF]/70 p-4">
            <div className="font-display text-[10px] font-bold uppercase tracking-widest text-[#074E84]">
              Natural-Language Prompt
            </div>
            <p className="mt-1 font-medium text-[#0A1B33]">
              “Show top vendors by open PO value and flag any purchase orders with expiring bank guarantees this quarter.”
            </p>
          </div>

          <div className="border-l-2 border-[#2380C6] pl-4">
            <div className="font-display text-[11px] font-bold uppercase tracking-widest text-[#2380C6]">
              Executive Summary (AI Verified)
            </div>
            <p className="mt-1">
              49 open PO lines across 51 onboarded vendors total SAR 4.16M. Top 4 suppliers account for 68% of active commitment; 2 guarantees require extension prior to Milestone 4 release.
            </p>
          </div>

          <div className="border-l-2 border-[#FCBC45] pl-4">
            <div className="font-display text-[11px] font-bold uppercase tracking-widest text-[#E8A020]">
              Recommended Expediting Action
            </div>
            <p className="mt-1">
              Prioritize PBG extension on PO-4510082 and schedule witness ITP inspection for Centrifugal Pump Package this week.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between border border-[#E7E3F5] bg-[#0A1B33] p-5 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-[#FCBC45]">
              Generated Aggregation Chart
            </span>
            <span className="font-mono text-[10px] text-white/50">db.purchaseorders.aggregate(...)</span>
          </div>

          <div className="my-4 space-y-3">
            {sampleBars.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-medium text-white/85">{b.label}</span>
                  <span className="font-display font-bold text-[#FCBC45]">{b.amount}</span>
                </div>
                <div className="h-2.5 w-full rounded bg-white/10">
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#2380C6] to-[#FCBC45]"
                    style={{ width: `${b.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/60">
            <span>Zero write permissions · Audited execution</span>
            <Link
              href="/db-agent"
              className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-[#FCBC45] hover:underline"
            >
              Launch DB Agent <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                  */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border border-[#E7E3F5] bg-white transition-shadow hover:shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-[15px] font-bold text-[#074E84]">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#E8A020] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-[#505E6B]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3D Extruded EPCORA Mark (Footer Sign-Off)                           */
/* ------------------------------------------------------------------ */

const MARK_LAYERS = 8;

function Mark3D() {
  const reduce = useReducedMotion();
  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        animate={reduce ? undefined : { rotateY: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d", rotateX: 6 }}
        className="relative h-24 w-24"
      >
        {Array.from({ length: MARK_LAYERS }).map((_, i) => (
          <img
            key={i}
            src="/images/epcora/epcora-mark-dark.svg"
            alt={i === 0 ? "EPCORA" : ""}
            aria-hidden={i !== 0}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
            style={{
              transform: `translateZ(${-i * 3}px)`,
              filter: i === 0 ? "none" : "brightness(0.32) saturate(0.85)",
            }}
          />
        ))}
      </motion.div>
      <div className="mark-floor-shadow" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main LandingPage Component                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIdx((v) => (v + 1) % ROTATING_WORDS.length);
    }, 2300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="epcora-landing min-h-screen bg-white text-[#505E6B]">
      {/* ============================== HERO BAND ============================== */}
      <section id="top" className="bg-denim relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 90px)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          {/* Left column: copy */}
          <div>
            <motion.p
              {...fade(0.05)}
              className="mb-5 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#FCBC45]"
            >
              <span className="pulse-dot h-2 w-2 rounded-full bg-[#FCBC45]" />
              EPCORA Stack · Digital EPC Operations Portal
            </motion.p>

            <motion.h1
              {...fade(0.15)}
              className="epcora-bordered-heading text-4xl !text-white sm:text-6xl xl:text-[4.1rem]"
            >
              Optaimyze <span className="text-[#FCBC45]">EPC</span> Portal
            </motion.h1>

            <motion.p
              {...fade(0.25)}
              className="mt-4 font-display text-lg font-semibold uppercase tracking-[0.18em] text-[#FCBC45] sm:text-xl"
            >
              Every Project. Every PO. Every Material.
            </motion.p>

            <motion.div
              {...fade(0.35)}
              className="mt-5 font-display text-2xl text-white/90 sm:text-3xl"
            >
              One command workspace for <FlipWord word={ROTATING_WORDS[wordIdx]} />
            </motion.div>

            <motion.p
              {...fade(0.5)}
              className="mt-5 max-w-xl text-lg leading-relaxed text-white/80"
            >
              Optaimyze unifies WBS project controls, six-dimension PO expediting, vendor qualification, material standardization, and QR asset intelligence on top of{" "}
              <span className="font-semibold text-white">SAP, Tally, and Excel</span> — complete with a read-only AI DB Agent that answers questions from your live data.
            </motion.p>

            <motion.div {...fade(0.65)} className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/auth/register" className="epcora-btn-gold">
                Start Free Trial <ArrowRight size={17} />
              </Link>
              <a
                href="#modules"
                className="inline-flex items-center gap-2.5 border-2 border-white px-8 py-4 font-display text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-white hover:text-[#074E84]"
              >
                Explore 8 Modules
              </a>
            </motion.div>

            {/* Counter stat pills */}
            <motion.div
              {...fade(0.85)}
              className="mt-12 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {HERO_STATS.map((s) => (
                <div key={s.label} className="border-l-2 border-[#FCBC45]/45 pl-3">
                  <div className="font-display text-3xl font-extrabold text-white">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/60">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column: framed product mockup */}
          <motion.div {...fade(0.4)} className="relative hidden lg:block">
            <div className="float-soft relative ml-auto w-fit">
              <div className="absolute -left-8 -top-8 h-36 w-36 border-[10px] border-[#FCBC45]/80" />
              <HeroCommandMock />
              <div className="absolute -bottom-8 -right-8 h-28 w-28 border-[10px] border-[#2380C6]/70" />

              {/* Floating guarantee & AI alert card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="absolute -right-10 top-12 w-60 bg-white p-4 shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)]"
              >
                <div className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  <AlertTriangle size={11} /> Live Expediting Alert
                </div>
                <div className="mt-1.5 font-display text-sm font-bold text-[#074E84]">
                  PBG Expiring in 19 Days
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#505E6B]">
                  <Sparkles size={11} className="text-[#2380C6]" /> AI recovery brief ready for PO-4510082
                </div>
                <div className="mt-3 h-0.5 w-10 bg-[#FCBC45]" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Mobile visual */}
        <div className="relative mx-auto max-w-7xl px-6 pb-16 lg:hidden">
          <HeroCommandMock />
        </div>
      </section>

      {/* ============================== MARQUEE TICKER ============================== */}
      <div className="relative overflow-hidden border-t border-white/10 bg-[#05052D] py-5">
        <div className="marquee-track items-center gap-10">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span
              key={idx}
              className="flex items-center gap-10 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.25em] text-white/65"
            >
              {item}
              <span className="h-1.5 w-1.5 rounded-full bg-[#FCBC45]" />
            </span>
          ))}
        </div>
      </div>

      {/* ============================== PROBLEM & IMPACT MATRIX ============================== */}
      <section id="problem" className="scroll-mt-24 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            eyebrow="Why EPC operations drift"
            title="The ERP holds transactions. The field runs on spreadsheets."
            sub="On complex engineering, procurement, and construction projects, schedules, purchase orders, vendor certificates, and material stock drift apart silently — and by the time the delay shows up in a monthly report, site work is already waiting."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PAINS.map((p, i) => (
              <motion.div
                key={p.title}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="epcora-service-card group"
              >
                <div className="epcora-icon-chip">
                  <p.icon size={24} />
                </div>
                <h3 className="font-display text-lg font-bold text-[#074E84]">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#505E6B]">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Cost of disconnected EPC controls table */}
          <motion.div
            {...reveal}
            className="mt-16 overflow-hidden border border-[#E7E3F5] shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)]"
          >
            <div className="bg-[#074E84] px-6 py-4">
              <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
                What disconnected EPC spreadsheets cost your project
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="bg-[#F6F4FF] font-display text-xs font-bold uppercase tracking-wider text-[#074E84]">
                    <th className="px-6 py-4">Failure Mode</th>
                    <th className="px-6 py-4">Commercial &amp; Financial Impact</th>
                    <th className="px-6 py-4">Site &amp; Operational Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E3F5] text-[#505E6B]">
                  {IMPACTS.map(([mode, fin, risk]) => (
                    <tr key={mode} className="transition-colors hover:bg-[#F6F4FF]/60">
                      <td className="px-6 py-4 font-semibold text-[#0A1B33]">{mode}</td>
                      <td className="px-6 py-4">{fin}</td>
                      <td className="px-6 py-4">{risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================== HOW IT WORKS & GOVERNANCE ============================== */}
      <section id="workflow" className="scroll-mt-24 bg-[#F6F4FF] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            eyebrow="How it works"
            title="Ingest. Unify. Expedite. Control."
            sub="Optaimyze turns raw SAP, Tally, and Excel extracts into an active EPC command center — uniting project controls, supply chain, and AI analytics in four moves."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {WORKFLOW_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="epcora-service-card group relative bg-white"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="epcora-icon-chip !mb-0">
                    <s.icon size={24} />
                  </div>
                  <span className="font-display text-4xl font-extrabold text-[#E7E3F5]">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#074E84]">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#505E6B]">{s.desc}</p>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight
                    size={18}
                    className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-[#2380C6] xl:block"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Dark Navy Governance & AI Safety Block */}
          <motion.div
            {...reveal}
            className="mt-16 bg-[#0A1B33] p-8 shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)] sm:p-10"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="epcora-eyebrow !text-[#FCBC45]">
                  Enterprise Governance &amp; AI Safety
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold !text-white sm:text-3xl">
                  Built for audit-proof EPC operations.
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white/70">
                <ShieldCheck size={15} className="mr-1.5 inline text-[#FCBC45]" />
                Every query, guarantee alert, vendor evaluation, and delivery milestone is governed, traceable, and safe for enterprise deployment.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {GOVERNANCE_CARDS.map((g) => (
                <div
                  key={g.title}
                  className="border border-white/10 bg-white/5 p-5 transition-colors hover:border-[#FCBC45]/50"
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: g.a }}
                  >
                    <g.icon size={20} />
                  </div>
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    {g.title}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/65">{g.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================== 8 EPC MODULES DEEP-DIVE ============================== */}
      <section id="modules" className="scroll-mt-24 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            eyebrow="The EPCORA Portal Suite"
            title="Eight tightly-integrated modules, one shared data backbone"
            sub="Click any module below to open its live workspace — from WBS project controls and six-dimension PO expediting to the read-only AI DB Agent."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                {...reveal}
                transition={{ ...reveal.transition, delay: (i % 4) * 0.08 }}
              >
                <Link href={m.href} className="epcora-service-card group flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundColor: m.a }}
                    >
                      <m.icon size={24} />
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold leading-snug text-[#074E84]">
                    {m.title}
                  </h3>
                  <div className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8A020]">
                    {m.tagline}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#505E6B]">{m.desc}</p>

                  <ul className="mt-4 flex-1 space-y-2.5 border-t border-[#E7E3F5] pt-4">
                    {m.points.map((pt) => (
                      <li key={pt} className="epcora-check-item">
                        <span className="epcora-check-badge">
                          <Check size={11} strokeWidth={3} className="text-[#E8A020]" />
                        </span>
                        <span className="text-[12.5px] leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-wider text-[#2380C6] transition-colors group-hover:text-[#E8A020]">
                    Open Module{" "}
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== SEE IT IN ACTION (SHOWCASE) ============================== */}
      <section id="showcase" className="scroll-mt-24 bg-[#F6F4FF] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            eyebrow="See it in action"
            title="Structure. Expedite. Interrogate."
            sub="A walkthrough of the screens your project controls, procurement, and site teams will live in every day."
          />

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div {...reveal}>
              <WbsPackagesShowcase />
              <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-[#505E6B]/75">
                01 — The WBS &amp; long-lead hierarchy behind every project
              </p>
            </motion.div>

            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <ExpediteGuaranteeShowcase />
              <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-[#505E6B]/75">
                02 — The six-dimension schedule &amp; guarantee watch on every PO
              </p>
            </motion.div>
          </div>

          <motion.div {...reveal} className="mt-8">
            <AiDbAgentShowcase />
            <p className="mt-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-[#505E6B]/75">
              03 — The read-only AI DB Agent that turns plain English into verified charts
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================== INDUSTRIES WE SERVE ============================== */}
      <section id="industries" className="scroll-mt-24 overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* Top split: framed photo left + heavy industry checklist right (matching Industries.jsx) */}
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div {...reveal} className="relative mx-auto w-full max-w-lg">
              <div className="absolute -left-5 -top-5 h-36 w-36 border-[10px] border-[#074E84]" />
              <img
                src="/images/epcora/industries.jpg"
                alt="Industrial EPC project planning"
                loading="lazy"
                className="relative w-full object-cover shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)]"
                style={{ height: 430 }}
              />
              <div className="absolute -bottom-6 -right-5 border-[10px] border-[#FCBC45]">
                <div className="h-24 w-24" />
              </div>
              <div className="absolute -bottom-8 left-8 flex items-center gap-4 bg-white px-6 py-4 shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)]">
                <span className="font-display text-4xl font-extrabold text-[#074E84]">
                  30<span className="text-[#E8A020]">+</span>
                </span>
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-[#505E6B]">
                  Years of EPC
                  <br />
                  Domain Expertise
                </span>
              </div>
            </motion.div>

            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }}>
              <div className="epcora-eyebrow mb-4">Industries We Serve</div>
              <h2 className="epcora-bordered-heading text-4xl sm:text-5xl">
                We speak <span className="text-[#2380C6]">heavy industry.</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#505E6B]">
                Purpose-built digital operations for capital-intensive engineering, procurement, and construction sectors.
              </p>
              <p className="mt-4 leading-relaxed text-[#505E6B]">
                From power generation and desalination to oil &amp; gas turnarounds — we bring decades of field-tested EPC expertise to every purchase order, vendor package, and material master we digitize.
              </p>

              <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {INDUSTRY_LIST.map((ind) => (
                  <div key={ind.name} className="epcora-check-item">
                    <span className="epcora-check-badge">
                      <Check size={12} strokeWidth={3.5} className="text-[#E8A020]" />
                    </span>
                    <span>{ind.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex max-w-md items-start gap-5 bg-[#F6F4FF] p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#074E84] text-white">
                  <Building2 size={22} strokeWidth={1.6} />
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#0A1B33]">
                  Works directly with your existing SAP, Tally, and Excel structures — giving project teams immediate clarity without disrupting core finance.
                </p>
              </div>
            </motion.div>
          </div>

          {/* 4 Photo Cards Grid (matching SPIndustriesRoi.jsx) */}
          <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind, i) => (
              <motion.div
                key={ind.name}
                {...reveal}
                transition={{ ...reveal.transition, delay: (i % 4) * 0.08 }}
                className="group relative overflow-hidden shadow-[0_10px_40px_-12px_rgba(7,78,132,0.18)] transition-shadow duration-500 hover:shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)]"
              >
                <img
                  src={ind.img}
                  alt={ind.name}
                  loading="lazy"
                  className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05052D]/95 via-[#05052D]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-2 h-0.5 w-10 bg-[#FCBC45] transition-all duration-500 group-hover:w-16" />
                  <h3 className="font-display text-lg font-bold !text-white">{ind.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">{ind.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== PRACTICE QUOTE & ROI BAND ============================== */}
      <section className="bg-denim relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 90px)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHead
            dark
            center
            eyebrow="The ROI of Optaimyze"
            title="Control you can take to the project board"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROI_METRICS.map((r, i) => (
              <motion.div
                key={r.label}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.08 }}
                className="border border-white/10 bg-white/5 p-7 text-center transition-colors hover:border-[#FCBC45]/50"
              >
                <div className="font-display text-5xl font-extrabold text-[#FCBC45]">{r.value}</div>
                <div className="mt-2 font-display text-sm font-bold uppercase tracking-wider text-white">
                  {r.label}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-white/70">{r.note}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...reveal} className="mx-auto mt-16 max-w-3xl text-center">
            <Quote size={44} className="mx-auto mb-4 rotate-180 text-[#FCBC45]" strokeWidth={1.3} />
            <p className="font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
              “Let us do the <span className="text-[#FCBC45]">orchestrating</span> of your project, vendor, and material workflows — while your team focuses on{" "}
              <span className="text-[#FCBC45]">building on time.</span>”
            </p>
            <div className="mx-auto mt-6 h-1 w-16 bg-[#FCBC45]" />
            <p className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              EPCORA Stack · Optaimyze Portal
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================== ONBOARDING STEPS ============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div {...reveal}>
              <div className="epcora-eyebrow mb-5">Deployment &amp; Onboarding</div>
              <h2 className="epcora-bordered-heading text-3xl sm:text-4xl">
                From ERP extract to live command center in a day
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#505E6B]">
                Bring your existing SAP, Tally, or spreadsheet data with you. Load your WBS, vendors, materials, and open POs — and let live tracking and the AI DB Agent go to work immediately.
              </p>
              <div className="relative mt-8">
                <div className="absolute -left-5 -top-5 h-28 w-28 border-8 border-[#FCBC45]/80" />
                <img
                  src="/images/epcora/hero.jpg"
                  alt="EPC construction site operations"
                  loading="lazy"
                  className="relative w-full object-cover shadow-[0_24px_60px_-16px_rgba(7,78,132,0.32)]"
                  style={{ height: 310 }}
                />
              </div>
            </motion.div>

            <div className="space-y-5">
              {ONBOARD_STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: i * 0.08 }}
                  className="epcora-service-card group flex items-start gap-5 !p-6"
                >
                  <div className="epcora-icon-chip !mb-0 shrink-0">
                    <s.icon size={22} />
                  </div>
                  <div>
                    <div className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-[#E8A020]">
                      {s.step}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold text-[#074E84]">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#505E6B]">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FAQ ACCORDION ============================== */}
      <section id="faq" className="scroll-mt-24 bg-[#F6F4FF] py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHead
            center
            eyebrow="Questions, answered"
            title="Frequently asked questions"
          />
          <motion.div {...reveal} className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================== FINAL GOLD CTA BAND ============================== */}
      <section className="relative overflow-hidden bg-[#FCBC45]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #05052D 0 2px, transparent 2px 90px)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <motion.div {...reveal}>
            <div className="epcora-eyebrow-center mb-5 !text-[#074E84]">
              Every Project. Every PO. Every Material.
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-tight !text-[#05052D] sm:text-5xl">
              Launch your EPC command center <br className="hidden sm:block" /> in a day, not a quarter.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#05052D]/80">
              Connect your SAP, Tally, or Excel extracts and give engineering, procurement, and site teams one unified workspace — with the read-only AI DB Agent built in.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/auth/register" className="epcora-btn-primary">
                Create Your Workspace <ArrowRight size={17} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2.5 border-2 border-[#05052D] px-8 py-4 font-display text-sm font-semibold uppercase tracking-wider text-[#05052D] transition-all duration-300 hover:bg-[#05052D] hover:text-[#FCBC45]"
              >
                Sign In to Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================== EPCORA DARK INK FOOTER ============================== */}
      <footer className="bg-[#05052D] pb-8 pt-16 text-white/70">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <img
                src="/images/epcora/epcora-mark-dark.svg"
                alt="EPCORA logo"
                className="h-9 w-auto object-contain"
              />
              <span className="font-display text-xl font-extrabold text-white">
                EPC<span className="text-[#FCBC45]">ORA</span> · Optaimyze
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              AI-powered project, vendor, purchase order, and material intelligence purpose-built for construction &amp; EPC teams.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                {
                  label: "Twitter",
                  d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
                },
                {
                  label: "LinkedIn",
                  d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
                },
                {
                  label: "Facebook",
                  d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#top"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 transition-all hover:border-[#FCBC45] hover:text-[#FCBC45]"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] !text-white">
              Core Modules
            </h4>
            <div className="mb-5 h-0.5 w-10 bg-[#2380C6]" />
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/projectsdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Projects &amp; WBS <span className="text-xs text-white/40">· Controls</span>
                </Link>
              </li>
              <li>
                <Link href="/purchaseordersdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Purchase Orders <span className="text-xs text-white/40">· Expediting</span>
                </Link>
              </li>
              <li>
                <Link href="/vendorsdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Vendors <span className="text-xs text-white/40">· Evaluation</span>
                </Link>
              </li>
              <li>
                <Link href="/materialsdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Materials &amp; Stock <span className="text-xs text-white/40">· Catalogue</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] !text-white">
              Operations &amp; AI
            </h4>
            <div className="mb-5 h-0.5 w-10 bg-[#2380C6]" />
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/trackingdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Field Tracking <span className="text-xs text-white/40">· PR / PO / Delivery</span>
                </Link>
              </li>
              <li>
                <Link href="/assetdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Assets &amp; MME <span className="text-xs text-white/40">· QR Registry</span>
                </Link>
              </li>
              <li>
                <Link href="/reportsdashboard" className="transition-colors hover:text-[#FCBC45]">
                  Executive Reports <span className="text-xs text-white/40">· Analytics</span>
                </Link>
              </li>
              <li>
                <Link href="/db-agent" className="transition-colors hover:text-[#FCBC45]">
                  AI DB Agent <span className="text-xs text-white/40">· Read-Only AI</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-display text-sm font-bold uppercase tracking-[0.2em] !text-white">
              Quick Links
            </h4>
            <div className="mb-5 h-0.5 w-10 bg-[#2380C6]" />
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#problem" className="transition-colors hover:text-[#FCBC45]">
                  Why EPC Operations Drift
                </a>
              </li>
              <li>
                <a href="#workflow" className="transition-colors hover:text-[#FCBC45]">
                  How It Works &amp; Governance
                </a>
              </li>
              <li>
                <a href="#showcase" className="transition-colors hover:text-[#FCBC45]">
                  Interactive Showcase
                </a>
              </li>
              <li>
                <a href="#industries" className="transition-colors hover:text-[#FCBC45]">
                  Industries Served
                </a>
              </li>
              <li>
                <Link href="/auth/login" className="font-semibold text-[#FCBC45] transition-colors hover:text-white">
                  Sign In to Workspace →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3D EPCORA Lockup Sign-Off */}
        <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center gap-3 border-t border-white/10 px-6 pb-4 pt-12 text-center">
          <Mark3D />
          <div className="text-3d-gold font-display text-3xl font-extrabold tracking-[0.3em]">
            EPCORA
          </div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50 [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
            Engineer · Procure · Construct
          </div>
          <div className="agentically">agentically</div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 px-6 pt-6 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} EPCORA Stack · Optaimyze Portal. All rights reserved.</span>
          <span>Digital Transformation Solutions for Construction &amp; EPC</span>
        </div>
      </footer>
    </div>
  );
}
