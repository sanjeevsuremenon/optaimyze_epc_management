import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Link from "next/link";

function vendorevaluation() {
  const router = useRouter();
  const [evalmarks, setEvalmarks] = useState({});
  const [evalmarks2, setEvalmarks2] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get vendorcode from router
  const { vendorcode } = router.query;

  useEffect(() => {
    // Only fetch if vendorcode is available
    if (!vendorcode) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [result1, result2] = await Promise.all([
          fetch(`/api/vendorevaluation/${vendorcode}`),
          fetch(`/api/vendors/vendorevalfixed/${vendorcode}`)
        ]);

        if (!result1.ok || !result2.ok) {
          throw new Error('Failed to fetch vendor data');
        }

        const json1 = await result1.json();
        const json2 = await result2.json();

        setEvalmarks(json1);
        setEvalmarks2(json2);
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vendorcode]);

  // Add loading and error states to the return
  if (!vendorcode) return <div>Loading...</div>;
  if (isLoading) return <div>Loading vendor data...</div>;
  if (error) return <div>Error: {error}</div>;

  // console.log(evalmarks);

  // console.log(evalmarks2);
  const fixedscoretext = [
    "Quote submission",
    "Payment terms",
    "Quality assurance",
    "Technical clarity",
    "Salesman interaction",
  ];

  return (
    <>
      <div className="relative w-[90%] h-[80%] mt-3 mx-auto bg-stone-100 shadow-md sm:rounded-lg">
        <a
          href="/vendorevaluation/webformat"
          className="absolute top-0 right-1 bg-blue-300 p-1 text-sm font-bold"
        >
          {" "}
          X{" "}
        </a>
        {/* summary scores */}
        <div className="flex flex-col justify-center pb-3 align-middle text-center">
          <h1 className="text-[14px] font-bold italic pb-3 mx-auto">
            Summary scores for evaluated Vendor code: {evalmarks?.vendorcode}
          </h1>
          <h1 className="font-Lato text-xs font-bold text-blue-900">
            Fixed score: {evalmarks?.finalfixedscore?.$numberDecimal}
          </h1>
          {evalmarks.finalscore2022 ? (
            <h1 className="font-Lato text-xs font-bold text-green-900">
              Year 2022 score: {evalmarks?.finalscore2022?.toFixed(2)}
            </h1>
          ) : null}
          {evalmarks.finalscore2023 ? (
            <h1 className="font-Lato text-xs font-bold text-teal-900">
              Year 2023 score: {evalmarks?.finalscore2023?.toFixed(2)}
            </h1>
          ) : null}
          {evalmarks.finalscore2024 ? (
            <h1 className="font-Lato text-xs font-bold text-green-900">
              Year 2024 score: {evalmarks?.finalscore2024?.toFixed(2)}
            </h1>
          ) : null}
        </div>
        <hr />
        {/* past scores */}

        <div className="flex flex-col justify-center pb-3">
          <h1 className="text-[14px] font-bold italic pb-3">Past scores:</h1>

          {evalmarks2?.past?.map((past, index) =>
            past.pastyearscore > 0 ? (
              <div key={index} className="w-1/2 flex flex-row justify-between">
                <h1 className="font-Lato text-xs font-bold text-blue-900">
                  Year {past.pastyear} :
                </h1>
                <h1 className="font-Lato text-xs font-bold text-green-900">
                  {past.pastyearscore}
                </h1>
              </div>
            ) : null
          )}
        </div>
        <hr />
        {/* fixed score basis */}
        <div className="flex flex-col justify-center pb-3">
          <h1 className="text-[14px] font-bold italic pb-3">
            Fixed score basis:
          </h1>
          {evalmarks2.fixedevalyear1?.fixedeval.map((fixed, index) => (
            <div key={index} className="w-1/2 flex flex-row justify-between">
              <h2 className="font-Lato text-xs font-bold text-teal-900">
                {fixedscoretext[index]}
              </h2>
              <h1 className="font-Lato text-xs font-bold text-blue-900">
                {fixed}
              </h1>
            </div>
          ))}
        </div>

        {/* po used for scoring */}
        {evalmarks2?.powiseevalyear1?.powiserating.length > 0 ? (
          <div className="flex flex-col justify-center pb-3">
            <h1 className="text-[14px] font-bold italic pb-3">
              PO used for scoring & PO value in SAR (2022):
            </h1>
            {evalmarks2.powiseevalyear1.powiserating.map((po, index) => (
              <div key={index} className="w-1/2 flex flex-row justify-between">
                <h2 className="font-Lato text-xs font-bold text-teal-900">
                  {po.ponumber}
                </h2>
                <h1 className="font-Lato text-xs font-bold text-blue-900">
                  {po.povalue}
                </h1>
              </div>
            ))}
          </div>
        ) : null}

        <hr />

        {evalmarks2?.powiseevalyear2?.powiserating.length > 0 ? (
          <div className="flex flex-col justify-center pb-3">
            <h1 className="text-[14px] font-bold italic pb-3">
              PO used for scoring & PO value in SAR (2023):
            </h1>
            {evalmarks2.powiseevalyear2.powiserating.map((po, index) => (
              <div key={index} className="w-1/2 flex flex-row justify-between">
                <h2 className="font-Lato text-xs font-bold text-teal-900">
                  {po.ponumber}
                </h2>
                <h1 className="font-Lato text-xs font-bold text-blue-900">
                  {po.povalue}
                </h1>
              </div>
            ))}
          </div>
        ) : null}

        <hr />

        {evalmarks2?.powiseevalyear3?.powiserating.length > 0 ? (
          <div className="flex flex-col justify-center pb-3">
            <h1 className="text-[14px] font-bold italic pb-3">
              PO used for scoring & PO value in SAR (2024):
            </h1>
            {evalmarks2.powiseevalyear3.powiserating.map((po, index) => (
              <div key={index} className="w-1/2 flex flex-row justify-between">
                <h2 className="font-Lato text-xs font-bold text-teal-900">
                  {po.ponumber}
                </h2>
                <h1 className="font-Lato text-xs font-bold text-blue-900">
                  {po.povalue}
                </h1>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default vendorevaluation;
