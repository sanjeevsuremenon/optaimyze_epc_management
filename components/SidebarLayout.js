import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

function prettify(path) {
  if (!path) return '';
  const p = path.replace(/\//g, '').replace(/\[.*\]/, '').replace(/-/g, '');
  const out = path.split('/').filter(Boolean).slice(-1)[0] || path;
  return out.replace(/-/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
}

const MODULES = [
  { id: 'projects', label: 'Projects', subs: [{ label: 'Projects', path: '/projects' }, { label: 'Projects (new)', path: '/projects1' }, { label: 'Project Dashboard', path: '/projectsdashboard' }] },
  { id: 'purchaseorders', label: 'Purchase Orders', subs: [{ label: 'PO Search', path: '/purchaseordersearch' }, { label: 'Purchase Orders', path: '/purchaseorders' }, { label: 'POs Dashboard', path: '/purchaseordersdashboard' }] },
  { id: 'vendors', label: 'Vendors', subs: [{ label: 'Vendors', path: '/vendors' }, { label: 'Vendors (legacy)', path: '/vendors1' }, { label: 'Vendors Dashboard', path: '/vendorsdashboard' }] },
  { id: 'materials', label: 'Materials', subs: [{ label: 'Materials', path: '/materials' }, { label: 'Materials (alt)', path: '/materials1' }, { label: 'Material Groups', path: '/material-groups' }, { label: 'Material Dashboard', path: '/materialsdashboard' }] },
  { id: 'tracking', label: 'Tracking', subs: [{ label: 'Tracking', path: '/tracking' }] },
  { id: 'reports', label: 'Reports', subs: [{ label: 'All Purchases', path: '/all-purchases-report' }, { label: 'Import Purchases', path: '/import-purchases-report' }, { label: 'Domestic Purchases', path: '/domestic-purchases-report' }] },
];

export default function SidebarLayout({ children }) {
  const router = useRouter();
  const [openModule, setOpenModule] = useState(() => {
    const match = MODULES.find(m => m.subs.some(s => router.pathname.startsWith(s.path)));
    return match ? match.id : MODULES[0].id;
  });
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    try {
      const cur = localStorage.getItem('opt_sidebar_open');
      setShowSidebar(cur === 'false' ? false : true);
    } catch (e) {
      setShowSidebar(true);
    }

    const onStorage = (e) => {
      if (e.key === 'opt_sidebar_open') {
        setShowSidebar(e.newValue === 'false' ? false : true);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleModuleClick = (id) => setOpenModule(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        {showSidebar && (
          <aside className="w-72 hidden md:block shrink-0 bg-slate-900/80 border-r border-slate-800 p-4">
            <div className="mb-6 px-2">
              <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Modules</div>
              {MODULES.map((mod) => (
                <div key={mod.id} className="mb-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleModuleClick(mod.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between hover:bg-slate-800/60 transition-colors ${openModule === mod.id ? 'bg-slate-800/60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-100">{mod.label}</span>
                      </div>
                      <div className="text-slate-400">
                        {openModule === mod.id ? <FiChevronDown /> : <FiChevronRight />}
                      </div>
                    </button>
                  </div>
                  {openModule === mod.id && (
                    <div className="mt-2 ml-2">
                      {mod.subs.map((s) => (
                        <Link key={s.path} href={s.path} legacyBehavior>
                          <a className={`block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800/50 ${router.pathname === s.path ? 'bg-slate-800 text-slate-100 font-medium' : ''}`}>{s.label || prettify(s.path)}</a>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 px-2">
              <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Other Modules</div>
              {MODULES.filter(m => m.id !== openModule).map(mod => (
                <Link key={mod.id} href={mod.subs?.[0]?.path || '#'} legacyBehavior>
                  <a className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800/50 mb-1">{mod.label}</a>
                </Link>
              ))}
            </div>
          </aside>
        )}

        <div className={`flex-1 p-6 ${showSidebar ? '' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
