import Head from "next/head";
import { getSession } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeliveryForm from "../../../components/Tracking/DeliveryForm";

export default function DeliveryFormPage() {
  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Delivery Form | Tracking | Optaimyze</title>
      </Head>
      <ToastContainer />
      <DeliveryForm />
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
