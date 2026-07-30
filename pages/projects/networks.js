import React from "react";
import ProjectsManager from "../../components/ProjectsManager";
import { getSession } from "next-auth/react";

export default function NetworksPage() {
  return <ProjectsManager initialTab="networks" />;
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
