import Head from "next/head";
import { getSession } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import POForm from "../../../components/Tracking/POForm";

export default function POFormPage() {
  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>PO Form | Tracking | Optaimyze</title>
      </Head>
      <ToastContainer />
      <POForm />
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
