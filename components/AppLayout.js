import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import ModuleHeader from "./ModuleHeader";
import FooterComponent from "./FooterComponent";
import SidebarLayout from "./SidebarLayout";

const publicPaths = ["/", "/auth/login", "/auth/register"];

export default function AppLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isPublicPage = publicPaths.includes(router.pathname);
  const requiresAuth = !isPublicPage && !router.pathname.startsWith("/api");

  useEffect(() => {
    setReady(true);
    if (requiresAuth && status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [requiresAuth, router, status]);

  if (!ready) return null;

  if (requiresAuth && status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/95 px-6 py-4 text-sm text-slate-200 shadow-lg shadow-slate-950/20">
          Checking login session...
        </div>
      </div>
    );
  }

  if (requiresAuth && status === "unauthenticated") return null;

  const dashboardPaths = [
    '/',
    '/projectsdashboard',
    '/materialsdashboard',
    '/purchaseordersdashboard',
    '/vendorsdashboard',
    '/projectdocumentsdashboard',
    '/assetdashboard'
  ];
  const isDashboard = dashboardPaths.includes(router.pathname);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ModuleHeader />
      {isDashboard ? (
        <main className="min-h-[calc(100vh-12rem)]">{children}</main>
      ) : (
        <SidebarLayout>
          <main className="min-h-[calc(100vh-12rem)]">{children}</main>
        </SidebarLayout>
      )}
      <FooterComponent />
    </div>
  );
}
