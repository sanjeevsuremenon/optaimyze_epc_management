import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Legacy route redirect: /openpurchaseorders/pocomments?ponumber=...
 * → /openpurchaseorders1/view/[ponumber]
 */
export default function POCommentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const ponumber = router.query.ponumber;
    if (ponumber) {
      router.replace(`/openpurchaseorders1/view/${encodeURIComponent(String(ponumber))}`);
    } else {
      router.replace("/openpurchaseorders1");
    }
  }, [router.isReady, router.query.ponumber, router]);

  return (
    <div className="app-page min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent" />
    </div>
  );
}
