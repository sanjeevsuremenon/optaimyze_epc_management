import React from "react";
import MaterialsManager from "../../components/MaterialsManager";
import { getSession } from "next-auth/react";

export default function MaterialsPage() {
  return <MaterialsManager initialTab="materials" />;
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
