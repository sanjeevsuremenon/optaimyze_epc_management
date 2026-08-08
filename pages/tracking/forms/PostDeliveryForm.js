import Head from "next/head";
import { getSession } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PostDeliveryForm from "../../../components/Tracking/PostDeliveryForm";

export default function PostDeliveryFormPage() {
  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Post Delivery Form | Tracking | Optaimyze</title>
      </Head>
      <ToastContainer />
      <PostDeliveryForm />
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
