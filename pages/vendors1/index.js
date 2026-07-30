import React from "react";
import PurchaseOrdersManager from "../../components/PurchaseOrdersManager";
import { getSession } from "next-auth/react";

export default function Vendors1Page() {
  return <PurchaseOrdersManager initialTab="vendors" />;
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