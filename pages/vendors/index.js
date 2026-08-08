import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy route: Vendors List now lives at /nonsapvendors */
export default function VendorsListRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/nonsapvendors");
  }, [router]);

  return (
    <div className="app-page flex min-h-[40vh] items-center justify-center text-sm text-app-text-muted">
      Redirecting to Non-SAP Vendors…
    </div>
  );
}
