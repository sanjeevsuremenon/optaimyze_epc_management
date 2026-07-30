import React from "react";
import MaterialsManager from "../../components/MaterialsManager";
import { getSession } from "next-auth/react";

export default function MaterialTypesPage() {
  return <MaterialsManager initialTab="mattypes" />;
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
