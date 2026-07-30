import React from "react";
import StockManager from "../../components/StockManager";
import Head from "next/head";

export default function CompleteStockPage() {
  return (
    <>
      <Head>
        <title>Complete Stock | Optaimyze EPC</title>
      </Head>
      <StockManager initialTab="completestock" />
    </>
  );
}
