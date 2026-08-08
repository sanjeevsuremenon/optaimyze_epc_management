import Head from "next/head";
import { getSession } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PRForm from "../../../components/Tracking/PRForm";

export default function PRFormPage() {
  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>PR Form | Tracking | Optaimyze</title>
      </Head>
      <ToastContainer />
      <PRForm />
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
  return { props: { session } };
}
