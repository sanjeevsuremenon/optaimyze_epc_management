import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  FiBarChart2,
  FiTable,
  FiFileText,
  FiShield,
  FiSend,
  FiDownload,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiZap,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiMail,
  FiInfo,
} from 'react-icons/fi';

const CHART_COLORS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316',
];

const STARTER_PROMPTS = [
  {
    title: 'PO Value by Vendor',
    prompt: 'Show top 10 vendors by total PO value in SAR as a bar chart',
    icon: FiBarChart2,
  },
  {
    title: 'PO Currency Split',
    prompt: 'Show purchase orders count by currency in a pie chart',
    icon: FiBarChart2,
  },
  {
    title: 'Open PO Lines',
    prompt: 'List all purchase order lines with pending quantity greater than 0 in a table',
    icon: FiTable,
  },
  {
    title: 'Stock by Plant',
    prompt: 'Show total current stock value by plant as a bar chart',
    icon: FiBarChart2,
  },
  {
    title: 'Vendor Locations',
    prompt: 'Show count of vendors by country in a table',
    icon: FiTable,
  },
  {
    title: 'Top Rated Vendors',
    prompt: 'List top 10 vendors by star rating with their tier and comment',
    icon: FiFileText,
  },
];

/** Tiny safe markdown renderer: headers, bold, bullets, plain lines. */
function SummaryView({ markdown }) {
  if (!markdown) return null;
  const lines = String(markdown).split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="font-semibold text-base mt-3">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="font-semibold text-lg mt-3">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className="font-bold text-xl mt-3">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-teal-500 mt-0.5">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  // **bold** and `code`
  const parts = [];
  let rest = text;
  let key = 0;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/;
  while (rest.length > 0) {
    const m = rest.match(regex);
    if (!m) {
      parts.push(rest);
      break;
    }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return parts;
}

function ChartView({ chart }) {
  if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FiBarChart2 className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No chart data available for this query.</p>
      </div>
    );
  }

  const dataKeys = chart.dataKeys && chart.dataKeys.length > 0 ? chart.dataKeys : ['value'];
  const colors = CHART_COLORS;

  const renderSeries = (dataKey, idx) => {
    const color = colors[idx % colors.length];
    const common = { key: dataKey, dataKey, name: dataKey, fill: color, stroke: color };
    switch (chart.type) {
      case 'pie':
        return null; // pie handled separately
      case 'line':
        return <Line {...common} strokeWidth={2.5} dot={{ r: 3 }} />;
      case 'area':
        return <Area {...common} fillOpacity={0.35} strokeWidth={2.5} />;
      case 'bar':
      default:
        return <Bar {...common} radius={[6, 6, 0, 0]} />;
    }
  };

  return (
    <div>
      {chart.title && (
        <h3 className="font-semibold text-base mb-4 text-slate-800 dark:text-slate-100">
          {chart.title}
        </h3>
      )}
      <div className="w-full" style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie
                data={chart.data}
                dataKey={dataKeys[0]}
                nameKey={chart.xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={130}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chart.data.map((entry, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : chart.type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((dk, idx) => renderSeries(dk, idx))}
            </LineChart>
          ) : chart.type === 'area' ? (
            <AreaChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((dk, idx) => renderSeries(dk, idx))}
            </AreaChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
              <XAxis dataKey={chart.xAxisKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((dk, idx) => renderSeries(dk, idx))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DBAgentPage() {
  const { data: session } = useSession();

  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [queryResult, setQueryResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 15;

  const handleRunQuery = async (queryText) => {
    const text = (queryText || '').trim();
    if (!text) {
      toast.error('Please enter a question or prompt');
      return;
    }
    if (!session?.user?.email) {
      toast.error('Please sign in to use the DB Agent');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setAiUnavailable(false);
      setCurrentStep(1);

      const stepTimer = setTimeout(() => setCurrentStep(2), 2500);

      const res = await fetch('/api/db-agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      clearTimeout(stepTimer);

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        const errorMsg = json?.error || `Server error (${res.status}). Please retry.`;
        const isUnavailable =
          json?.isAiServiceUnavailable ||
          res.status === 503 ||
          /LLM API error|No LLM API key|Authentication Fails|invalid_request_error|insufficient_quota|Rate limit|Failed to communicate with LLM|Empty response received from LLM|busy|temporarily unavailable/i.test(
            errorMsg
          );

        if (isUnavailable) {
          setAiUnavailable(true);
          setLastFailedPrompt(text);
          setErrorMessage(null);
          toast.info('The AI agent is currently busy. Please try again shortly.');
          return;
        }

        throw new Error(errorMsg);
      }

      const result = { ...json.data, timestamp: new Date().toLocaleTimeString() };
      setQueryResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
      setPromptInput('');
      setLastFailedPrompt('');
      setTablePage(1);
      setTableSearch('');

      const lower = text.toLowerCase();
      if (result.step2.chart && /(chart|graph|plot|pie|bar)/.test(lower)) {
        setActiveTab('chart');
      } else if (result.step2.table && /table|list|show/.test(lower)) {
        setActiveTab('table');
      } else {
        setActiveTab('summary');
      }

      toast.success(
        `Query completed. Verified 2-step pipeline. Found ${result.step1.recordsCount} records.`
      );
    } catch (err) {
      console.error('DB Agent query error:', err);
      const msg = err.message || 'Could not execute the AI query';
      const isUnavailable =
        /LLM API error|No LLM API key|Authentication Fails|invalid_request_error|insufficient_quota|Rate limit|Failed to communicate with LLM|Empty response received from LLM|busy|temporarily unavailable/i.test(
          msg
        );

      if (isUnavailable) {
        setAiUnavailable(true);
        setLastFailedPrompt(text);
        setErrorMessage(null);
        toast.info('The AI agent is currently busy. Please try again shortly.');
      } else {
        setErrorMessage(msg);
        toast.error(msg.length > 180 ? `${msg.slice(0, 180)}...` : msg);
      }
    } finally {
      setLoading(false);
      setCurrentStep(null);
    }
  };

  const handleExportExcel = () => {
    if (!queryResult?.step2.table?.rows?.length) {
      toast.error('No table rows to export');
      return;
    }
    try {
      const { columns, rows } = queryResult.step2.table;
      const headers = columns.map((c) => c.label);
      const dataRows = rows.map((r) => columns.map((c) => r[c.key] ?? ''));

      const metadata = [
        ['OPTAIMYZE DB AGENT QUERY REPORT'],
        ['User Prompt', queryResult.prompt],
        ['Execution Date', new Date().toLocaleString()],
        ['Validation Confidence', queryResult.step2.validationReview.confidence],
        ['Total Records', rows.length],
        [],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([...metadata, headers, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DB Agent Results');

      const filename = `DB_Agent_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Saved ${rows.length} rows to ${filename}`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  const filteredTableRows = useMemo(() => {
    if (!queryResult?.step2.table) return [];
    const { columns, rows } = queryResult.step2.table;
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase().trim();
    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [queryResult, tableSearch]);

  const totalTablePages = Math.ceil(filteredTableRows.length / tablePageSize) || 1;
  const paginatedTableRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredTableRows.slice(start, start + tablePageSize);
  }, [filteredTableRows, tablePage]);

  const tabs = [
    { key: 'summary', label: 'Summary', icon: FiFileText },
    { key: 'table', label: 'Data Table', icon: FiTable },
    { key: 'chart', label: 'Chart', icon: FiBarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Head>
        <title>DB Agent · Optaimyze</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-400/40 text-teal-500">
              <FiCpu className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                DB Agent — AI Natural Language Query
              </h1>
              <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                Ask questions in plain English to analyze{' '}
                <span className="text-teal-600 dark:text-teal-400 font-semibold">Purchase Orders</span>,{' '}
                <span className="text-sky-600 dark:text-sky-400 font-semibold">Vendors</span>,{' '}
                <span className="text-violet-600 dark:text-violet-400 font-semibold">Stock</span> and{' '}
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Projects</span> with
                verified Table & Chart outputs
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
            <FiShield className="w-3.5 h-3.5" />
            Read-Only · 2-Step Verified
          </span>
        </div>

        {/* AI Agent Busy / Unavailable notice */}
        {aiUnavailable && (
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-sky-500/10 dark:from-amber-500/15 dark:via-slate-800/90 dark:to-sky-500/15 border border-amber-300/70 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
                  <FiCpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                      <FiClock className="w-3 h-3" />
                      AI Agent Busy
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    AI Agent is currently busy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    The AI query assistant is temporarily busy or experiencing service limits. Please try again after some time. If this persists, please contact your administrator.
                  </p>

                  {lastFailedPrompt && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 max-w-full overflow-hidden">
                      <span className="text-xs font-semibold text-slate-400 shrink-0">Query:</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 italic truncate font-mono">
                        "{lastFailedPrompt}"
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleRunQuery(lastFailedPrompt || promptInput)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 active:scale-95 text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Try Again
                    </button>
                    <a
                      href="mailto:admin@optaimyze.com?subject=Optaimyze%20AI%20Agent%20Assistance%20Request"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm transition-all"
                    >
                      <FiMail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Contact Admin
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAiUnavailable(false)}
                className="self-start text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                aria-label="Dismiss"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Generic Error notice */}
        {errorMessage && !aiUnavailable && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Query could not be completed</h4>
                <p className="text-xs mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 p-1"
              aria-label="Dismiss"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Query input */}
        <div className="mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <div className="p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery(promptInput);
              }}
            >
              <div className="relative">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Ask any question, e.g. 'Show top 10 vendors by PO value in a bar chart'..."
                  disabled={loading}
                  className="w-full pr-36 py-4 px-4 text-sm rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={loading || !promptInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" /> Ask Agent
                    </>
                  )}
                </button>
              </div>

              {/* Starter prompts */}
              <div className="mt-4">
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <FiZap className="w-4 h-4 text-amber-500" />
                  Try asking one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((starter, idx) => {
                    const Icon = starter.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPromptInput(starter.prompt);
                          handleRunQuery(starter.prompt);
                        }}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Icon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span>{starter.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Progress indicator */}
            {loading && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    {currentStep === 1
                      ? 'Step 1: Formulating MongoDB query plan & executing (read-only)...'
                      : 'Step 2: Reviewing data integrity, verifying accuracy & rendering visualizations...'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Step {currentStep || 1} of 2
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-sky-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: currentStep === 2 ? '90%' : '45%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!queryResult && !loading && !aiUnavailable && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <FiCpu className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Ask a question above to query the Optaimyze MongoDB database.</p>
            <p className="text-xs mt-1">The agent only performs read operations (find / aggregate / count / distinct).</p>
          </div>
        )}

        {/* Results */}
        {queryResult && (
          <div className="space-y-6">
            {/* Validation card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Executed Query
                    </p>
                    <p className="text-sm font-medium mt-1 text-slate-800 dark:text-slate-100">
                      {queryResult.prompt}
                    </p>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" />
                      {queryResult.timestamp} · {queryResult.step1.recordsCount} records
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {queryResult.step2.table?.rows?.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="h-8 px-3 text-xs flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                      >
                        <FiDownload className="w-3.5 h-3.5" /> Excel
                      </button>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        queryResult.step2.validationReview.isAccurate
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                      }`}
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      {queryResult.step2.validationReview.confidence} Confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab.key
                          ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <SummaryView markdown={queryResult.step2.summaryMarkdown} />
                    {queryResult.step2.validationReview.notes && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
                          Auditor Notes
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {queryResult.step2.validationReview.notes}
                        </p>
                      </div>
                    )}
                    {queryResult.step2.suggestedFollowUps?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                          Suggested follow-ups
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {queryResult.step2.suggestedFollowUps.map((fu, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setPromptInput(fu);
                                handleRunQuery(fu);
                              }}
                              disabled={loading}
                              className="text-xs px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'table' && (
                  <div>
                    {queryResult.step2.table?.columns?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="relative flex-1 max-w-sm">
                            <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={tableSearch}
                              onChange={(e) => {
                                setTableSearch(e.target.value);
                                setTablePage(1);
                              }}
                              placeholder="Search table..."
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {filteredTableRows.length} rows
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 uppercase tracking-wide text-left">
                                {queryResult.step2.table.columns.map((col) => (
                                  <th key={col.key} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedTableRows.map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                                >
                                  {queryResult.step2.table.columns.map((col) => (
                                    <td key={col.key} className="px-3 py-2 whitespace-nowrap max-w-xs truncate">
                                      {String(row[col.key] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {totalTablePages > 1 && (
                          <div className="flex items-center justify-end gap-2 mt-3 text-xs">
                            <button
                              type="button"
                              disabled={tablePage <= 1}
                              onClick={() => setTablePage((p) => p - 1)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                            >
                              Prev
                            </button>
                            <span className="text-slate-500 dark:text-slate-400">
                              Page {tablePage} of {totalTablePages}
                            </span>
                            <button
                              type="button"
                              disabled={tablePage >= totalTablePages}
                              onClick={() => setTablePage((p) => p + 1)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <FiTable className="w-10 h-10 mb-2 opacity-40" />
                        <p className="text-sm">No tabular data returned for this query.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chart' && <ChartView chart={queryResult.step2.chart} />}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Recent Queries
            </p>
            <div className="space-y-2">
              {history.slice(0, 5).map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQueryResult(h)}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate"
                >
                  <span className="text-teal-600 dark:text-teal-400 font-semibold mr-2">
                    {h.step1.recordsCount} rec
                  </span>
                  {h.prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
