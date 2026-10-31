import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ModuleGrid from "../components/ModuleGrid";
import LandingPage from "../components/landing/LandingPage";

function Home() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="app-page min-h-screen">
      <Head>
        <title>EPCORA · Optaimyze EPC Management Portal</title>
        <meta
          name="description"
          content="EPCORA Stack — AI-powered EPC project controls, six-dimension PO expediting, vendor management, material standardization, and read-only AI analytics."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {mounted && session ? (
          <ModuleGrid />
        ) : (
          <LandingPage />
        )}
      </main>
    </div>
  );
}

export default Home;

