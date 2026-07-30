import React from "react";
import StockManager from "../../components/StockManager";
import Head from "next/head";

export default function SpecialStockPage() {
  return (
    <>
      <Head>
        <title>Special Stock | Optaimyze EPC</title>
      </Head>
      <StockManager initialTab="specialstock" />
    </>
  );
}
