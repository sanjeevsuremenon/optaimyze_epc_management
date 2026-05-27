import React from "react";
import Image from "next/image";

import { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import { Pie } from "react-chartjs-2";
import { motion } from "framer-motion";
import Chart from "chart.js/auto";
import Radialprogress from "../components/Radialprogress";
import moment from "moment";
import ProjdocUpload from "../components/ProjdocuploadComponent";
import ProjDocsView from "../components/projdocsViewComponent";
import FooterComponent from "./FooterComponent";


import Router, { useRouter } from "next/router";

function Projectdetails({ projects }) {
  const [project, setProject] = useState({});
  const [network, setNetwork] = useState({});
  const [specialstk, setSpecialstk] = useState([]);
  const [purchaseorders, setPurchaseorders] = useState([]);
  const [purchaseordersnetwork, setPurchaseordersnetwork] = useState([]);
  const [openrequisitions, setOpenrequisitions] = useState([]);
  const [selectedProject, setSelectedProject] = useState("IS%2FGP.22.001");
  const [isLoading, setLoading] = useState(true);
  const [polist, setPolist] = useState([]);
  const [currentPurchaseorder, setCurrentPurchaseorder] = useState(null);
  const [selectedpolist, setSelectedpolist] = useState([]);

  // let projectid = "IS%2FGP.22.001";

  const { data: session } = useSession();

  const router = useRouter();
 

  useEffect(() => {
    const fetchProject = async () => {
      const response = await fetch(`/api/projects/${selectedProject}`);
      const json = await response.json();
      setProject(json);
    };
    fetchProject();
  }, [selectedProject]);

  useEffect(() => {
    const fetchNetwork = async () => {
      const response = await fetch(`/api/networks/${selectedProject}`);
      const json = await response.json();
      setNetwork(json);
    };
    fetchNetwork();
  }, [selectedProject]);

  useEffect(() => {
    const fetchSpecialstk = async () => {
      const response = await fetch(
        `/api/specialstock/project/${selectedProject}`
      );
      const json = await response.json();
      setSpecialstk(json);
    };
    fetchSpecialstk();
  }, [selectedProject]);

  useEffect(() => {
    const fetchPurchaseorders = async () => {
      const response = await fetch(
        `/api/purchaseorders/project/consolidated/${selectedProject}`
      );
      const json = await response.json();
      setPurchaseorders(json);
    };
    fetchPurchaseorders();
  }, [selectedProject]);

  useEffect(() => {
    const fetchPurchaseordersnetwork = async () => {
      const response = await fetch(
        `/api/purchaseorders/project/consolidated/network/${network["network-num"]}`
      );
      const json = await response.json();
      setPurchaseordersnetwork(json);
    };
    fetchPurchaseordersnetwork();
  }, [network]);

  // render detailed PO
  useEffect(() => {
    const fetchselectedPolist = async () => {
      setLoading(true);
      const response = await fetch(
        `/api/purchaseorders/porder/${currentPurchaseorder}`
      );
      const json = await response.json();
      setSelectedpolist(json);
      setLoading(false);
    };
    fetchselectedPolist();
  }, [currentPurchaseorder]);

  useEffect(() => {
    const fetchOpenrequisitions = async () => {
      const response = await fetch(
        `/api/openrequisitions/project/${selectedProject}`
      );
      const json = await response.json();
      setOpenrequisitions(json);
    };
    fetchOpenrequisitions();
  }, [selectedProject]);

  


  console.log(project);
  // console.log(specialstk);
  console.log(purchaseorders);
  console.log(purchaseordersnetwork);
  // console.log(openrequisitions);
  console.log(network);

  const setActiveProject = (projectid, index) => {
    console.log(projectid);
    setSelectedProject(projectid.replace("/", "%2F"));
  };

  const setActivePo = (ponum, index) => {
    setCurrentPurchaseorder(ponum);
  };

  const variant = {
    hidden: {
      scale: 0.6,
      opacity: 0.3,
      color: "",
    },
    visible: {
      scale: 1.0,
      opacity: 1,
      transition: {
        delay: 0.3,
      },
    },
  };

  return (
    <>
      <div className="flex overflow-x-scroll pb-10 hide-scroll-bar">
        <div className="flex flex-nowrap lg:ml-20 md:ml-10 ml-5 ">
          {projects?.map((project, index) => (
            <div
              key={index}
              className="inline-block px-3"
              onClick={() => {
                setActiveProject(project["project-wbs"], index);
                console.log("I am clicked!");
              }}
            >
              <div className="w-64 h-60 max-w-xs overflow-hidden rounded-lg shadow-md bg-zinc-400 hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <div className="flex justify-center">
                  <div className="block rounded-lg shadow-lg bg-white max-w-sm text-center">
                    <div className="py-3 px-6 border-b bg-zinc-200 border-gray-300 dark:bg-stone-800 font-bold">
                      {project["project-wbs"]}
                    </div>
                    <div className="p-6 bg-slate-100">
                      <h5 className="text-gray-900 text-sm font-medium mb-[2px]">
                        {project["project-name"]}
                      </h5>
                      <p className="text-emerald-900 text-[8px] mb-[1px]">
                        {project["project-incharge"]}
                      </p>
                    </div>
                    <div className="py-3 px-6  bg-orange-200 border-t border-gray-300 text-gray-600 text-xs">
                      Created: {moment(project["created-date"]).fromNow()}
                    </div>
                  </div>
                </div>
              </div>

              {/* <div classNameName="w-32 h-32 max-w-xs overflow-hidden rounded-lg shadow-md bg-white hover:shadow-xl transition-shadow duration-300 ease-in-out"></div> */}
            </div>
          ))}
        </div>
      </div>
      <div>
        <section className="text-gray-600 body-font">
          <div className="container px-0.5 py-0.5 mx-auto bg-zinc-50">
            <div className="flex flex-wrap w-full border-b-2 flex-col border-slate-600 shadow-outer my-4 bg-gradient-to-r from-zinc-50 to-stone-200">
              <div className="h-1 bg-gray-200 rounded overflow-hidden">
                <div className="w-24 h-full bg-blue-500"></div>
              </div>

              <h1 className="md:text-xl lg:text-xl font-medium title-font mb-2 border-b-[1px] border-zinc-600 shadow-md hover:shadow-2xl  text-amber-900">
                <span className="text-md text-fuchsia-800 font-Freehand">
                  {" "}
                  Project name:{" "}
                </span>
                {project["project-name"]}
              </h1>
              <p className="lg:w-1/2 w-full leading-relaxed border-b-[1px] border-stone-600  uppercase text-xl font-semibold text-amber-900 pb-3">
                <span className="text-[14px] text-fuchsia-800 ">
                  {" "}
                  Project Manager:{" "}
                </span>
                {project["project-incharge"]}
              </p>
              <p className="ml-auto lg:w-1/2 w-full leading-relaxed text-lg text-fuchsia-800">
                <span className="text-md font-semibold text-orange-800">
                  {" "}
                  Project start:{" "}
                </span>
                {moment(project["start-date"]).format("DD/MM/YYYY")}
              </p>
              <p className="pb-4 ml-auto lg:w-1/2 w-full leading-relaxed text-lg text-fuchsia-800">
                <span className="text-md font-semibold text-orange-800">
                  {" "}
                  Project scheduled end:{" "}
                </span>
                {moment(project["finished-date"]).format("DD/MM/YYYY")}
              </p>
              {!network ? null : (
                <p className="ml-auto lg:w-1/2 w-full leading-relaxed text-lg text-gray-800">
                  <span className="text-md text-blue-800">
                    {" "}
                    Network Number:{" "}
                  </span>
                  {network["network-num"]}
                </p>
              )}
            </div>
            <div className="flex flex-wrap -m-4">
              <div className="xl:w-1/2 md:w-full  p-4 h-96 max-h-96 overflow-y-scroll hide-scroll-bar">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl p-6  bg-stone-200 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    PROJECT DOCUMENTS
                  </h2>
                  <ProjDocsView />
                  <ProjdocUpload wbs={project["project-wbs"]} />
                </div>
              </div>

              <div className="xl:w-1/2 md:w-1/2 p-4   overflow-y-scroll  hide-scroll-bar">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl bg-zinc-100 p-6 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    Special stock: (Currently still in stock)
                  </h2>

                  <div className="p-36 pt-3 pb-3">
                    <Pie
                      data={{
                        labels: specialstk.map(
                          (stock) => stock["material-code"]
                        ),
                        datasets: [
                          {
                            backgroundColor: [
                              "rgb(12, 121, 11)",
                              "rgb(120,1,11)",
                              "rgb(1,12,55)",
                              "rgb(55,55,55)",
                            ],
                            borderColor: "rgb(255, 99, 132)",
                            data: specialstk.map((stock) => stock["stock-val"]),
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
                  <div className="leading-relaxed text-base">
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase dark:text-gray-400">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 bg-gray-50 dark:bg-gray-800"
                            >
                              Material code:
                            </th>
                            <th scope="col" className="px-6 py-3">
                              Stock Quantity:
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 bg-gray-50 dark:bg-gray-800"
                            >
                              Stock Value (SAR)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {specialstk
                            .sort((a, b) => {
                              return b["stock-val"] - a["stock-val"];
                            })
                            .map((row, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200 dark:border-gray-700"
                              >
                                <th
                                  scope="row"
                                  className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-blue-400 border border-blue-400"
                                >
                                  {row["material-code"]}
                                </th>
                                <td className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">
                                  {row["stock-qty"].$numberDecimal}
                                </td>
                                <td className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-yellow-300 border border-yellow-300">
                                  {(
                                    Math.round(row["stock-val"] * 100) / 100
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:w-1/2 md:w-1/2 p-4 max-h-96 overflow-y-scroll  hide-scroll-bar">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl p-6 bg-zinc-100 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    SCHEDULE DETAILS
                  </h2>
                  <div className="leading-relaxed text-base">
                    <h3 className="w-1/2 bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-blue-400 border border-blue-400">
                      {" "}
                      Sch. Project start:{" "}
                    </h3>
                    <h3 className="w-1/2 bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1  rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-500">
                      {" "}
                      Sch Project end:
                    </h3>
                    <h3 className="w-1/2 bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1  rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">
                      {" "}
                      Est. Project start:
                    </h3>
                    <h3 className="w-1/2 bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-yellow-300 border border-yellow-300">
                      {" "}
                      Est. Project end:{" "}
                    </h3>
                    <h3 className="w-1/2 bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-purple-400 border border-purple-400">
                      {" "}
                      Actual Project start:
                    </h3>
                    <h3 className="w-1/2 bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-pink-400 border border-pink-400">
                      {" "}
                      Actual Project end:{" "}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="xl:w-1/2 md:w-1/2 max-h-96 overflow-y-scroll  hide-scroll-bar p-4">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl p-6 bg-neutral-200 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    BUDGET DETAILS
                  </h2>
                  <div className="leading-relaxed text-base">
                    <h3 className="w-1/2 bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-blue-400 border border-blue-400">
                      {" "}
                      Materials- Budgeted:{" "}
                    </h3>
                    <h3 className="w-1/2 bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1  rounded dark:bg-gray-700 dark:text-gray-400 border border-gray-500">
                      {" "}
                      Materials- Committed: (PO Value)
                    </h3>
                    <h3 className="w-1/2 bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1  rounded dark:bg-gray-700 dark:text-green-400 border border-green-400">
                      {" "}
                      Materials Actual: (GR and SES)
                    </h3>
                    <h3 className="w-1/2 bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-yellow-300 border border-yellow-300">
                      {" "}
                      Services- Budgeted:{" "}
                    </h3>
                    <h3 className="w-1/2 bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-purple-400 border border-purple-400">
                      {" "}
                      Services - Committed:
                    </h3>
                    <h3 className="w-1/2 bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-1.5 mb-1 rounded dark:bg-gray-700 dark:text-pink-400 border border-pink-400">
                      {" "}
                      Services Actual:{" "}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="xl:w-1/2 md:w-1/2 p-4 overflow-y-scroll  hide-scroll-bar">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl p-6 bg-zinc-100 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="6" cy="6" r="3"></circle>
                      <circle cx="6" cy="18" r="3"></circle>
                      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"></path>
                    </svg>
                  </div>
                  <h2 className="text-[14px] shadow-slate-600 shadow-md py-3 bg-slate-800 text-white flex justify-center font-medium title-font mb-2">
                    Purchase Orders for: {project["project-wbs"]}
                  </h2>
                  <div className="leading-relaxed text-base">
                    <div className="overflow-x-auto relative">
                      <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="py-3 px-1">
                              PO Number
                            </th>
                            <th scope="col" className="py-3 px-1">
                              PO Date
                            </th>
                            <th scope="col" className="py-3 px-1">
                              Vendor
                            </th>
                            <th scope="col" className="py-3 px-1">
                              Total PO Value
                            </th>

                            <th scope="col" className="py-3 px-1 text-teal-800">
                              Bal value
                            </th>
                            <th scope="col" className="py-3 px-1">
                              PO Progress
                            </th>

                            <th scope="col" className="py-3 px-1">
                              Comments
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseorders.map((purchase, index) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 ? "bg-zinc-50" : null
                              } border-b dark:bg-gray-900 dark:border-gray-700`}
                              onClick={() => {
                                setActivePo(purchase.ponum, index);
                                console.log("I am clicked!");
                              }}
                            >
                              <th
                                scope="row"
                                className="flex flex-col py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <p className="text-[10px] text-blue-900 font-Montserrat font-semibold">
                                  {purchase["ponum"]}
                                  {/* {purchase["po-line-item"]} */}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-purple-700">
                                  {moment(purchase["podate"]).format(
                                    "DD-MM-YYYY"
                                  )}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-teal-700">
                                  {purchase["vendor"]}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-teal-700">
                                  {(
                                    Math.round(purchase.poval * 100) / 100
                                  ).toLocaleString()}
                                </p>
                              </th>

                              <td className="py-4 px-1 text-teal-900 font-bold text-[10px]">
                                {(
                                  Math.round(purchase.balgrval * 100) / 100
                                ).toLocaleString()}{" "}
                                <br />
                              </td>
                              <td className="p-2">
                                <Radialprogress
                                  percent={Math.round(
                                    ((purchase.poval - purchase.balgrval) /
                                      purchase.poval) *
                                      100
                                  )}
                                />
                              </td>

                              <td className="p-2">
                              <buton className="cursor-pointer bg-emerald-800 text-white text-[10px]" type="submit"  onClick = {() => {
                                 
                             
                             router.push(
                               `/openpurchaseorders/pocomments?ponumber=${purchase["ponum"]}`
                             );
                              }} > <Image src="/images/comment.png" width={30} height={10}></Image> </buton>
                              </td>
                             
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <h2 className="text-[14px] shadow-md py-3 flex justify-center bg-stone-800 text-white shadow-slate-800 font-medium title-font mb-2">
                    Purchase Orders under network: {network["network-num"]}
                  </h2>

                  <div className="leading-relaxed text-base">
                    <div className="overflow-x-auto relative">
                      <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="py-3 px-1">
                              PO Number
                            </th>
                            <th scope="col" className="py-3 px-1">
                              PO Date
                            </th>
                            <th scope="col" className="py-3 px-1">
                              Vendor
                            </th>
                            <th scope="col" className="py-3 px-1">
                              Total PO Value
                            </th>

                            <th scope="col" className="py-3 px-1 text-teal-800">
                              Bal value
                            </th>
                            <th scope="col" className="py-3 px-1">
                              PO Progress
                            </th>

                            <th scope="col" className="py-3 px-1">
                              Comments
                            </th>

                          </tr>
                        </thead>
                        <tbody>
                          {purchaseordersnetwork.map((purchase, index) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 ? "bg-zinc-50" : null
                              } border-b dark:bg-gray-900 dark:border-gray-700`}
                              onClick={() => {
                                setActivePo(purchase.ponum, index);
                                console.log("I am clicked!");
                              }}
                            >
                              <th
                                scope="row"
                                className="flex flex-col py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <p className="text-[10px] text-blue-900 font-Montserrat font-semibold">
                                  {purchase["ponum"]}
                                  {/* {purchase["po-line-item"]} */}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-purple-700">
                                  {moment(purchase["podate"]).format(
                                    "MM-DD-YYYY"
                                  )}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-teal-700">
                                  {purchase["vendor"]}
                                </p>
                              </th>
                              <th>
                                <p className="text-[10px] text-teal-700">
                                  {(
                                    Math.round(purchase.poval * 100) / 100
                                  ).toLocaleString()}
                                </p>
                              </th>

                              <td className="py-4 px-1 text-teal-900 font-bold text-[10px]">
                                {(
                                  Math.round(purchase.balgrval * 100) / 100
                                ).toLocaleString()}{" "}
                                <br />
                              </td>
                              <td className="p-2">
                                <Radialprogress
                                  percent={Math.round(
                                    ((purchase.poval - purchase.balgrval) /
                                      purchase.poval) *
                                      100
                                  )}
                                />
                              </td>
                              <td className="p-2">
                              <buton type="submit" onClick = {() => {
                                 
                             
                             router.push(
                               `/openpurchaseorders/pocomments?ponumber=${purchase["ponum"]}`
                             );
                              }} > Comments </buton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* po details component1 */}
              <div className="xl:w-1/2 md:w-1/2 p-4 overflow-y-scroll  hide-scroll-bar">
                <div className="border-1 border-zinc-600 shadow-md hover:shadow-2xl p-6 bg-zinc-100 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="bg-stone-900 py-3  rounded text-[12px] text-white  font-semibold">
                    {/* PO Details for:{currentPurchaseorder}{" "} */}
                    {selectedProject ? (
                      <div className="text-sm">
                        {" "}
                        Selected PO: {" "}
                        {/* {selectedProject.replace("%2F", "/")}{" "} */}
                        {currentPurchaseorder}
                      </div>
                    ) : null}
                    {/* <div className="rounded-lg h-64 overflow-hidden"> */}
                    {/* <Image
                  width="100%"
                  height="50%"
                  objectFit="cover"
                  layout="responsive"
                  alt="content"
                  className="object-cover object-center h-1/2 w-1/2 opacity-70"
                  src="/images/vendorpage2.jpg"
                /> */}
                    {/* </div> */}

                    {!isLoading ? (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={variant}
                      >
                        <div className="flex flex-col py-1">
                          <div className="overflow-y-auto sm:-mx-6 lg:-mx-8">
                            <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
                              <div className="overflow-y-auto">
                                <table className="min-w-full text-center">
                                  <thead className="border-b bg-zinc-100 ">
                                    <tr>
                                      <th
                                        scope="col"
                                        className="text-[102x] py-2 font-medium text-gray-900 px-2"
                                      >
                                        PO Item
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        Material
                                      </th>
                                      {/* <th
                                          scope="col"
                                          className="text-[10px] font-medium text-gray-900 px-2"
                                        >
                                          Mat Group
                                        </th>
                                        <th
                                          scope="col"
                                          className="text-[10px] font-medium text-gray-900 px-2"
                                        >
                                          Plant Code
                                        </th> */}
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        PO Quantity
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        PO UOM
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        PO Unit Price
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        PO Item Value (SR)
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        Pending Qty
                                      </th>
                                      <th
                                        scope="col"
                                        className="text-[12px] font-medium text-gray-900 px-2"
                                      >
                                        Pending Value (SR)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedpolist
                                      .sort((a, b) => {
                                        return a["po-line-item"].localeCompare(
                                          b["po-line-item"],
                                          undefined,
                                          {
                                            numeric: true,
                                            sensitivity: "base",
                                          }
                                        );
                                      })
                                      .map((row, index) => (
                                        <tr
                                          key={index}
                                          className="bg-stone-100  border-b-4 py-3 my-3"
                                        >
                                          <td className="px-2 py-3 whitespace-nowrap text-[10px] font-thin text-black">
                                            {row["po-line-item"]}
                                          </td>

                                          <td className="px-1 py-2 whitespace-nowrap text-[11px] font-bold text-black">
                                            {row["material"]["matdescription"]}
                                          </td>
                                          {/* <td className="px-2 whitespace-nowrap text-[8px] font-medium text-black">
                                              {row["material"]["matgroup"]}
                                            </td>
                                            <td className="text-[10px] text-black font-light px-2 max-h-full whitespace-nowrap">
                                              {row["plant-code"]}
                                            </td> */}
                                          <td className="text-[12px] text-black font-medium px-2 max-h-full whitespace-nowrap">
                                            {row["po-quantity"].$numberDecimal}
                                          </td>
                                          <td className="text-[12px] text-black font-light px-2 max-h-full whitespace-nowrap">
                                            {row["po-unit-of-measure"]}
                                          </td>
                                          <td className="text-[12px] text-black font-medium px-2 max-h-full whitespace-nowrap text-right">
                                            {(
                                              Math.round(
                                                row["po-unit-price"] * 100
                                              ) / 100
                                            ).toLocaleString()}
                                          </td>
                                          <td className="text-[12px] text-black font-bold px-2 max-h-full whitespace-nowrap text-right">
                                            {(
                                              Math.round(
                                                row["po-value-sar"] * 100
                                              ) / 100
                                            ).toLocaleString()}
                                          </td>
                                          <td className="text-[12px] text-black font-medium px-2 max-h-full whitespace-nowrap text-right">
                                            {row["pending-qty"].$numberDecimal}
                                          </td>
                                          <td className="text-[10px] text-red-800  font-black px-2 max-h-full whitespace-nowrap text-right">
                                            {(
                                              Math.round(
                                                row["pending-val-sar"] * 100
                                              ) / 100
                                            ).toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className=" bg-white">
                        <div className="flex justify-center items-center h-full">
                          <img
                            className="h-16 w-16"
                            src="https://icons8.com/preloaders/preloaders/1488/Iphone-spinner-2.gif"
                            alt=""
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* the PO details component */}
              {/* <div className="relative flex flex-col gap-6 sm:flex-row md:flex-col lg:flex-row"> */}
              {/* <div className="w-[600px] py-2 border-2 border-zinc-600 shadow-md hover:shadow-2xl rounded-2xl flex flex-col h-[600px]  overflow-y-scroll  hide-scroll-bar"> */}

              {/* </div> */}
              {/* </div> */}
              {/* </div> */}

              <div className="xl:w-1/2 md:w-1/2 p-4  overflow-y-scroll  hide-scroll-bar">
                <div className="border-2 border-zinc-600 shadow-md hover:shadow-2xl p-6 bg-zinc-100 rounded-lg">
                  <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-pink-100 text-pink-500 mb-4">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h2 className="text-lg text-gray-900 font-medium title-font mb-2">
                    Open PR : {project["project-wbs"]}
                  </h2>
                  <div className="leading-relaxed text-base">
                    <div className="overflow-x-auto relative">
                      <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="py-3 px-1">
                              PR Number & Item
                            </th>

                            <th scope="col" className="py-3 px-1">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {openrequisitions.map((purchase, index) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 ? "bg-red-50" : null
                              } border-b dark:bg-gray-900 dark:border-gray-700`}
                            >
                              <th
                                scope="row"
                                className="flex flex-col py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                                  {purchase["pur-requisition"]} -{" "}
                                  {purchase["pr-itemno"]}
                                </p>
                                <p className="text-[10px] text-purple-700">
                                  {moment(purchase["pr-rel-date"]).format(
                                    "MM-DD-YYYY"
                                  )}
                                </p>

                                <p className="text-[10px] text-teal-700">
                                  {purchase["materialcode"]}{" "}
                                  <span className="text-teal-900">
                                    {purchase["matdescription"]}
                                  </span>
                                </p>
                              </th>

                              <td className="justify-self-center  text-red-800">
                                {" "}
                                {Math.round(
                                  purchase["pr-quantity"].$numberDecimal,
                                  0
                                )}{" "}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* <button className="flex mx-auto mt-16 text-white bg-pink-500 border-0 py-2 px-8 focus:outline-none hover:bg-pink-600 rounded text-lg">
            EDIT
          </button> */}
          </div>
        </section>
      </div>
      <div className="pt-3 mt-6">
        <FooterComponent />
      </div>
    </>
  );
}

export default Projectdetails;
