import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

function vendorevaluation() {
  const router = useRouter();
  const [evalmarks, setEvalmarks] = useState([]);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/vendorevaluation`);
      const json = await result.json();

      setEvalmarks(json);
    })();
  }, []);

  return (
    <>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Vendor code
              </th>
              <th scope="col" className="px-6 py-3">
                Vendor Name
              </th>
              <th scope="col" className="px-6 py-3">
                Fixed score
              </th>
              <th scope="col" className="px-6 py-3">
                Year 2022 score
              </th>
              <th scope="col" className="px-6 py-3">
                Year 2023 score
              </th>
              <th scope="col" className="px-6 py-3">
                Year 2024 score
              </th>
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {evalmarks.map((evalmark, index) => (
              <tr
                key={index}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-[12px] shadow-md shadow-gray-300 text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {evalmark.vendorcode}
                </th>
                <td className="px-6 py-4 font-semibold tracking-wider italic font-Poppins">{evalmark.vendorname}</td>
                <td className="px-6 py-4 text-teal-800 font-bold">
                  {evalmark.finalfixedscore.$numberDecimal}
                </td>
                <td className="px-6 py-4 text-center text-[12px] text-sky-800 italic font-semibold">{evalmark.finalscore2022?.toFixed(2)}</td>
                <td className="px-6 py-4 text-center text-[12px] text-stone-800 italic font-semibold">{evalmark.finalscore2023?.toFixed(2)}</td>
                <td className="px-6 py-4 text-center text-[12px] text-green-600 italic font-semibold">
                  {evalmark.finalscore2024?.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <a
                    href={`/vendorevaluation/webformat/${evalmark.vendorcode}`}
                    className="font-medium text-[10px] bg-rose-100 py-1 px-2 pointer-cursor  rounded-sm text-blue-600 dark:text-blue-500 hover:bg-rose-200 dark:hover:bg-rose-400"
                  >
                    Details
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default vendorevaluation;
