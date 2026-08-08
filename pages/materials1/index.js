import { useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";

/** Legacy route: materials manager now lives at /materials */
export default function Materials1Redirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/materials");
  }, [router]);

  return (
    <div className="app-page flex min-h-[40vh] items-center justify-center text-sm text-app-text-muted">
      Redirecting to Materials…
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
