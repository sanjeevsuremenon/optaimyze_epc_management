import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import Image from "next/image";

function SectionComponent() {
  const [invPlantwise, setInvplantwise] = useState([]);
  const [countPoType, setCountPoType] = useState([]);
  const [valuePoType, setValuePoType] = useState([]);
  const [topvendorsCount, setTopvendorsCount] = useState([]);
  const [topvendorsVal, setTopvendorsVal] = useState([]);
  const [totalmaterials, setTotalmaterials] = useState(null);
  const [purchasedmaterials, setPurchasedmaterials] = useState(null);
  const [stockmaterials, setStockmaterials] = useState(null);
  const [cleansedmaterials, setCleansedmaterials] = useState(null);
  const [commentedmaterials, setCommentedmaterials] = useState(null);

  const [topmaterials, setTopmaterials] = useState([]);
  const [topPobalance, setToppobalance] = useState([]);

  const [yearwiseTrans, setYearwiseTrans] = useState([]);
  const [yearwiseIssue, setYearwiseIssue] = useState([]);
  const [yearwiseReceipt, setYearwiseReceipt] = useState([]);
  const [mgwisestock, setMgwisestock] = useState([]);

  // plantwise inventory
  useEffect(() => {
    const fetchInvPlantwise = async () => {
      const response = await fetch(`/api/inventory/plantwise`);
      const json = await response.json();
      setInvplantwise(json);
    };
    fetchInvPlantwise();
  }, []);

  // to extract PO document wise total PO value
  useEffect(() => {
    const fetchCountPoType = async () => {
      const response = await fetch(
        `/api/purchaseorders/porder/mattypewisecount`
      );
      const json = await response.json();
      setCountPoType(json);
    };
    fetchCountPoType();
  }, []);

  // to extract total PO issued- doc wise

  useEffect(() => {
    const fetchValuePoType = async () => {
      const response = await fetch(`/api/purchaseorders/porder/mattypewise`);
      const json = await response.json();
      setValuePoType(json);
    };
    fetchValuePoType();
  }, []);

  // to extract top 20 vendors by number of PO

  useEffect(() => {
    const fetchPoVendorwise = async () => {
      const response = await fetch(
        `/api/purchaseorders/porder/vendorwise/topvendorsCount`
      );
      const json = await response.json();
      setTopvendorsCount(json);
    };
    fetchPoVendorwise();
  }, []);

  // to extract top 20 vendors by value of PO

  useEffect(() => {
    const fetchPoVendorwiseVal = async () => {
      const response = await fetch(
        `/api/purchaseorders/porder/vendorwise/topvendorsValue`
      );
      const json = await response.json();
      setTopvendorsVal(json);
    };
    fetchPoVendorwiseVal();
  }, []);

  // to extract top 20 vendors by value of PO

  useEffect(() => {
    const fetchPoBalanceVal = async () => {
      const response = await fetch(`/api/purchaseorders/porder/topbalance`);
      const json = await response.json();
      setToppobalance(json);
    };
    fetchPoBalanceVal();
  }, []);

  // to extract no. of materials
  useEffect(() => {
    const fetchTotalmaterials = async () => {
      const response = await fetch(`/api/materials/totalmaterials`);
      const json = await response.json();

      setTotalmaterials(json);
    };
    fetchTotalmaterials();
  }, []);

  // to extract no. of materials
  useEffect(() => {
    const fetchpurchasedmaterials = async () => {
      const response = await fetch(`/api/materials/purchasematerials`);
      const json = await response.json();

      setPurchasedmaterials(json);
    };
    fetchpurchasedmaterials();
  }, []);

  // to extract no. of materials
  useEffect(() => {
    const fetchStockmaterials = async () => {
      const response = await fetch(`/api/materials/stockmaterials`);
      const json = await response.json();

      setStockmaterials(json);
    };
    fetchStockmaterials();
  }, []);

  // to extract no. of materials
  useEffect(() => {
    const fetchcleansedmaterials = async () => {
      const response = await fetch(`/api/materials/cleansedmaterials`);
      const json = await response.json();

      setCleansedmaterials(json);
    };
    fetchcleansedmaterials();
  }, []);

  useEffect(() => {
    const fetchtopmaterials = async () => {
      const response = await fetch(`/api/completestock`);
      const json = await response.json();

      setTopmaterials(json);
    };
    fetchtopmaterials();
  }, []);

  useEffect(() => {
    const fetchyearwisetrans = async () => {
      const response = await fetch(`/api/materialdocuments/yearwisetrans`);
      const json = await response.json();

      setYearwiseTrans(json);
    };
    fetchyearwisetrans();
  }, []);

  useEffect(() => {
    const fetchyearwiseIssue = async () => {
      const response = await fetch(`/api/materialdocuments/yearwiseissues`);
      const json = await response.json();

      setYearwiseIssue(json);
    };
    fetchyearwiseIssue();
  }, []);

  useEffect(() => {
    const fetchyearwiseReceipt = async () => {
      const response = await fetch(`/api/materialdocuments/yearwisereceipts`);
      const json = await response.json();

      setYearwiseReceipt(json);
    };
    fetchyearwiseReceipt();
  }, []);

  useEffect(() => {
    const fetchmgwisestock = async () => {
      const response = await fetch(`/api/completestock/topstock`);
      const json = await response.json();

      setMgwisestock(json);
    };
    fetchmgwisestock();
  }, []);
  console.log(mgwisestock);

  return (
    <>
      {/* first row */}

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400 border-4"></div>
        <span className="flex-shrink mx-4 text-sky-900  text-2xl tracking-widest font-Freehand">
          PO's Value and Numbers so far
        </span>
        <div className="flex-grow border-t border-gray-400 border-4"></div>
      </div>
      <div className="grid grid-cols-2 gap-3 pb-6">
        {/* within 1st row, 1st col- PO line items and PO value since 2016 till now */}
        <div className="col-span-1 bg-gray-50 px-12">
          <div className="w-[450px] h-[425px] ">
            <h6 className="mt-6  text-[12px] font-lato text-zinc-900">
              <span className="text-[14px] font-extrabold ">
                PO Line items so far{" "}
              </span>{" "}
              (31-Asset, 45-Domestic, 46-Import, 47-Cash, 61-Service, 71-Channel
              partner, 91-Contract )
            </h6>
            <Bar
              className="p-1 m-1"
              data={{
                labels: countPoType.map((row) => row._id),
                datasets: [
                  {
                    backgroundColor: "rgb(122, 123, 255)",
                    borderColor: "rgb(255, 99, 132)",
                    data: countPoType
                      .sort((a, b) => a._id - b._id)
                      .map((row) => row.count),
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  maintainAspectRatio: false,
                },
              }}
            />
          </div>
        </div>

        <div className="col-span-1 bg-gray-50 px-12">
          <div className="w-[450px] h-[425px] ">
            <h6 className="mt-6  text-[12px] font-lato text-zinc-900">
              <span className="text-[14px] font-extrabold ">
                PO Value so far{" "}
              </span>{" "}
              (31-Asset, 45-Domestic, 46-Import, 47-Cash, 61-Service, 71-Channel
              partner, 91-Contract )
            </h6>
            <Bar
              className="p-1 m-1"
              data={{
                labels: valuePoType.map((row) => row._id),
                datasets: [
                  {
                    backgroundColor: "rgb(122, 123, 255)",
                    borderColor: "rgb(255, 99, 132)",
                    data: valuePoType
                      .sort((a, b) => a._id - b._id)
                      .map((row) => row.count),
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  maintainAspectRatio: false,
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400 border-4"></div>
        <span className="flex-shrink mx-4 text-sky-900 tracking-widest text-2xl font-Freehand">
          Inventory Values
        </span>
        <div className="flex-grow border-t border-gray-400 border-4"></div>
      </div>

      <div className="grid grid-cols-3 gap-3 pb-6">
        <div className="col-span-1 bg-gray-50 px-12">
          <div className="w-[450px] h-[450px] flex my-auto justify-center">
            <div className="p-3 w-[300px] h-[300px]">
              <h5 className=" mt-3 text-[14px]  font-bold tracking-tight text-gray-900 dark:text-white">
                2023- current Inventory Value (SAR)
              </h5>
              <div className="mt-3 px-1">
                <Pie
                  data={{
                    labels: invPlantwise.map((stock) =>
                      stock["_id"] == "1100" ? "Dammam" : "Jubail"
                    ),
                    datasets: [
                      {
                        backgroundColor: [
                          "rgb(173, 216, 230)",
                          "rgb(144, 238, 144)",
                        ],
                        borderColor: "rgb(255, 99, 132)",
                        data: invPlantwise.map((stock) => stock["count"]),
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-gray-50 px-12 w-full h-[500px]">
          <h5 className="text-[12px]  font-bold tracking-tight text-gray-900 dark:text-white">
            Current Materialgroupwise Inventory Value (SAR)
          </h5>
          <Bar
            className="bg-zinc-100"
            data={{
              labels: mgwisestock
                .sort((a, b) => b.count - a.count)
                .map((row) => row._id),
              datasets: [
                {
                  backgroundColor: "rgb(122, 123, 255)",
                  borderColor: "rgb(255, 99, 132)",
                  data: mgwisestock.map((row) => row.count),
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
                maintainAspectRatio: false,
              },
            }}
          />
        </div>
      </div>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400 border-4"></div>
        <span className="flex-shrink mx-4 text-sky-900 tracking-widest text-2xl font-Freehand">
          Year-wise Online Transactions
        </span>
        <div className="flex-grow border-t border-gray-400 border-4"></div>
      </div>


      <div className="grid grid-cols-3 gap-3 pb-6">
        

        <div className="col-span-1  bg-gray-50 ">
          <h3>Year-wise Receipts (in SAR)</h3>
          <Bar
            className="p-1 m-1"
            data={{
              labels: yearwiseReceipt.map((row) => row._id),
              datasets: [
                {
                  backgroundColor: "rgb(122, 123, 255)",
                  borderColor: "rgb(255, 99, 132)",
                  data: yearwiseReceipt.map((row) => row.count),
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
                maintainAspectRatio: false,
              },
            }}
          />
        </div>
        <div className="col-span-1  bg-gray-50 ">
          <h3>Year-wise Issues (in SAR)</h3>
          <Bar
            className="p-1 m-1"
            data={{
              labels: yearwiseIssue.map((row) => row._id),
              datasets: [
                {
                  backgroundColor: "rgb(255, 204, 203)",
                  borderColor: "rgb(255, 99, 132)",
                  data: yearwiseIssue.map((row) => row.count),
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
                maintainAspectRatio: false,
              },
            }}
          />
        </div>
        <div className="col-span-1  bg-gray-50 ">
          <h3>
            Year-wise Overall transactions (Receipts LESS issues) (in SAR)
          </h3>
          <Bar
            className="p-1 m-1"
            data={{
              labels: yearwiseTrans.map((row) => row._id),
              datasets: [
                {
                  backgroundColor: "rgb(255, 14, 20)",
                  borderColor: "rgb(255, 99, 132)",
                  data: yearwiseTrans.map((row) => row.count),
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
                maintainAspectRatio: false,
              },
            }}
          />
        </div>
      </div>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400 border-4"></div>
        <span className="flex-shrink mx-4 text-sky-900 tracking-widest text-2xl font-Freehand">
          Material cleansing exercise updates & other misc SAP data
        </span>
        <div className="flex-grow border-t border-gray-400 border-4"></div>
      </div>

      <div>
          {/* <h5 className="text-md font-bold leading-none text-zinc-900 w-1/4 mx-auto  dark:text-white">
            Total materials coded in Material master:
          </h5> */}
          <div className="flow-root w-1/4 mx-auto">
            <ul
              role="list"
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              <li className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                      Total Active in Master:
                    </p>
                  </div>
                  <div className="bg-gray-100 tracking-widest text-gray-800 text-sm font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                    {totalmaterials}
                  </div>
                </div>
              </li>
              <li className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="bg-red-100  text-red-800 text-xs font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-red-900 dark:text-red-300">
                      Materials Purchased so far:
                    </p>
                  </div>
                  <div className="bg-red-100 tracking-widest text-red-800 text-sm font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-red-900 dark:text-red-300">
                    {purchasedmaterials}
                  </div>
                </div>
              </li>
              <li className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                      Stock Materials:
                    </p>
                  </div>
                  <div className="bg-blue-100 tracking-widest text-blue-800 text-sm font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                    {stockmaterials}
                  </div>
                </div>
              </li>
              <li className="py-3 sm:py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                      Cleansed Materials:
                    </p>
                  </div>
                  <div className="bg-yellow-100 tracking-widest text-yellow-800 text-sm font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                    {cleansedmaterials}
                  </div>
                </div>
              </li>
              <li className="pt-3 pb-0 sm:pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-green-900 dark:text-green-300">
                      Users contributed corrected so far:
                    </p>
                  </div>
                  <div className="bg-green-100 tracking-widest text-green-800 text-sm font-medium mr-2 px-2.5 py-1.5 rounded-full dark:bg-green-900 dark:text-green-300">
                    {commentedmaterials}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-400 border-4"></div>
        <span className="flex-shrink mx-4 text-sky-800 text-2xl font-Freehand tracking-widest">
          Top-20 Data
        </span>
        <div className="flex-grow border-t border-gray-400 border-4"></div>
      </div>

      <div className="grid grid-cols-6 gap-3 pb-6">
      <div className="bg-white col-span-1 flex flex-col w-full">
          
            <h3 className="mx-auto text-[12px] uppercase border-emerald-900  font-semibold  text-red-900 py-3">
              {" "}
              Top 20 vendors{" "}
              <span className="text-[10px] font-bold">
                (Value of total PO issued)
              </span>{" "}
            </h3>
            <div className="text-xs uppercase font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {topvendorsVal
                .sort(function (a, b) {
                  return b.count - a.count;
                })
                .slice(0, 20)
                .map((row) => (
                  <p
                    key={row._id}
                    aria-current="true"
                    className="block w-full px-4 py-3 font-bold  text-zinc-800 text-[12px] bg-blue-50 border-b border-gray-200 rounded-t-lg  dark:bg-gray-800 dark:border-gray-600"
                  >
                    {row._id}{" "}
                    <h3 className="w-3/4 mr-2 bg-blue-50 text-stone-800 text-xs tracking-wider font-bold px-1.5 py-0.5 rounded shadow-lg shadow-slate-800 dark:bg-gray-700 dark:text-green-400 border border-green-400 ">
                      {(Math.round(row.count * 100) / 100).toLocaleString(
                        "en-US",
                        { style: "currency", currency: "SAR" }
                      )}
                    </h3>
                  </p>
                ))}
            </div>
          
        </div>

        <div className="bg-white col-span-1 flex flex-col">
          <h3 className="mx-auto text-[12px] uppercase border-emerald-900  font-semibold  text-red-900 py-3">
            {" "}
            Top 20 vendors{" "}
            <span className="text-[10px] font-bold">
              (Number of PO Line items)
            </span>{" "}
          </h3>
          <div className="text-xs uppercase font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {topvendorsCount
              .sort(function (a, b) {
                return b.count - a.count;
              })
              .slice(0, 20)
              .map((row) => (
                <p
                  key={row._id}
                  aria-current="true"
                  className="block w-full font-bold px-4 py-3 text-zinc-800 text-[12px] bg-blue-50 border-b border-gray-200 rounded-t-lg  dark:bg-gray-800 dark:border-gray-600"
                >
                  {row._id}{" "}
                  <h3 className="w-1/4 pl-3 bg-green-50 mx-auto text-green-900 shadow-lg shadow-green-800 text-xs tracking-wider font-bold px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400 ">
                    {" "}
                    {row.count}{" "}
                  </h3>
                </p>
              ))}
          </div>
        </div>
        <div className="bg-white col-span-2 flex flex-col">
        <h3 className="mx-auto text-[12px] uppercase border-emerald-900  font-bold  text-red-900 py-3">
            {" "}
            Top Valued Inventory (in SAR){" "}
          </h3>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-3 py-3">
                    Matcode
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Inventory(in SAR)
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Receipts & issues
                  </th>
                  
                </tr>
              </thead>
              <tbody>
                {topmaterials.slice(0, 20).map((row) => (
                  <tr
                    key={row._id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  >
                    <th
                      scope="row"
                      className="px-3 py-4 text-[12px] font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {row["material-code"]}
                    </th>
                    <td className="px-3 py-4 tracking-wider text-[12px] font-semibold">
                      {(
                        Math.round(row["current-stkval"] * 100) / 100
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    </td>
                    <td className="px-3 py-4 tracking-wider text-[12px] font-black text-red-800">
                      {(
                        Math.round(row["receipt-val"] * 100) / 100
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    
                    <span className="px-3 py-4 tracking-wider text-[12px] font-black text-green-900">
                      { (Math.round(row["issue-val"])) == 0 ? null :
                        (Math.round(row["issue-val"] * 100) / 100
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          </div>

          <div className="bg-white col-span-2 flex flex-col">
            <h3 className="mx-auto justify-center text-[12px] uppercase border-emerald-900  font-bold  text-red-900 py-3">
              {" "}
              Top Valued open Purchase orders{" "}
            </h3>
            {/* <div className="relative overflow-x-auto"> */}
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              {/* <div className="text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"> */}
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    PO Number
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Vendor code
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Vendor Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Balance Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPobalance
                  .sort(function (a, b) {
                    return b.count - a.count;
                  })
                  .slice(0, 20)
                  .map((row) => (
                    <tr
                      key={row._id.ponum}
                      className="bg-white border-b  dark:bg-gray-800 dark:border-gray-700"
                    >
                      <th
                        scope="row"
                        className="px-2 py-4 font-medium pl-6 text-[12px] font-bold  text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        {row._id.ponum}
                      </th>
                      <td className="px-2 py-4 text-xs pl-6  font-semibold">
                        {row._id.vendor}
                      </td>
                      <td className="px-2 py-4 text-[10px] font-bold text-red-800">
                        {row._id.venname}
                      </td>
                      <td className="px-2 py-4 tracking-wider text-green-900 text-[12px] font-semibold">
                        {(Math.round(row.count * 100) / 100).toLocaleString(
                          "en-US",
                          { style: "currency", currency: "SAR" }
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* </div> */}
          </div>

        </div>


    </>
  );
}

export default SectionComponent;
