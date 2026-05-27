import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";


import { getSession } from "next-auth/react";

import Matdocument from "./Matdocument";

function Matdocs() {
  const { ref, inView } = useInView();
  const LIMIT = 100;

  const fetchMatdocs = async (page) => {
    const response = await fetch(
      `/api/materialdocuments?limit=${LIMIT}&page=${page}`
    );
    const json = response.json();
    return json;
  };

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["matdocs"],
      queryFn: ({ pageParam = 1 }) => fetchMatdocs(pageParam),
      getNextPageParam: (lastPage, allPages) => {
        const nextPage =
          lastPage.length === LIMIT ? allPages.length + 1 : undefined;
        return nextPage;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  console.log(data);

  const content =
    isSuccess &&
    data.pages.map((page, i) =>
      page.map((matdoc, i) => {
        if (page.length === i + 1) {
          return <Matdocument ref={ref} key={matdoc._id} matdoc={matdoc} />;
        }
        return <Matdocument key={matdoc._id} matdoc={matdoc} />;
      })
    );

  return (
    <div className="w-screen">      <p className="w-full font-bold text-lg px-96 px-3 bg-purple-100 shadow-md shadow-zinc-800">
        List of all Material documents
      </p>

      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 ">
        <thead className="text-[12px] text-gray-700 uppercase bg-gray-50 font-bold shadow-xl shadow-zinc-800 dark:bg-gray-700 dark:text-gray-400 ">
          <tr className="grid grid-cols-12">
            <th scope="col" className="px-6 py-3 col-span-1">
              Doc number#
            </th>
            <th scope="col" className="px-6 py-3 col-span-1">
              Item number#
            </th>
            <th scope="col" className="px-6 py-3 col-span-1">
              Doc Date
            </th>
            <th scope="col" className="px-6 py-3 col-span-1">
              Material code
            </th>
            <th scope="col" className="px-6 py-3 col-span-3">
              Material text
            </th>
            <th scope="col" className="px-6 py-3 col-span-1">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3 col-span-1 ">
              Amount (SAR)
            </th>
            <th
              scope="col"
              className="px-6 py-3 col-span-2 flex justify-evenly"
            >
              <span className="px-1">Plant</span>
              <span className="px-1">SLoc</span>
              <span className="px-1">Mvt Type</span>
            </th>
            <th scope="col" className="px-6 py-3 col-span-1">
              Account
            </th>
          </tr>
        </thead>
        <tbody>{content}</tbody>
      </table>

      {isFetchingNextPage && <h3>Loading...</h3>}
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

export default Matdocs;
