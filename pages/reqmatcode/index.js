import React, { useState, useEffect, useMemo, Fragment } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";
import moment from "moment";
import Image from "next/image";

const matflag = [
  {
    id: "1",
    name: "CAPEX",
    type: "Fixed Asset",
    inactive: false,
  },
  {
    id: "2",
    name: "CHN",
    type: "Channel Partner",
    inactive: false,
  },
  {
    id: "3",
    name: "OTH",
    type: "Others",
    inactive: false,
  },
];

import { useSession } from "next-auth/react";

import { CheckIcon } from "@heroicons/react/solid";
import { getSession } from "next-auth/react";
import { Listbox } from "@headlessui/react";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";
import { useRouter } from "next/router";

function Reqmatcode() {
  const { data: session } = useSession();
  const [selectedMatflag, setSelectedmatflag] = useState(matflag[2]);
  const [mattypes, setMattypes] = useState([]);
  // const [filteredMattypes, setFilteredmattypes] = useState([])
  const [mattypeselected, setMattypeselected] = useState("ZOFC");
  const [maxLimit, setMaxlimit] = useState(40);

  const [longDesc, setLongDesc] = useState("");
  const [newdescription, setNewdescription] = useState("");
  const [length, setLength] = useState(0);
  const [query, setQuery] = useState("");
  const [matcodechat, setMatcodechat] = useState([]);
  const [uom, setUom] = useState("");

  const [unallottedRequests, setUnallottedrequests] = useState([])

  const router = useRouter();

  const mattypeChange = (event) => {
    console.log(event.target.value);
    setMattypeselected(event.target.value);
  };

  const [matgroupselected, setMatgroupselected] = useState("");
  const [secondarymatgroupselected, setSecondarymatgroupselected] =
    useState("");
  const [matcodereq, setMatcodereq] = useState([]);

  const matgroupChange = (event) => {
    setMatgroupselected(event.target.value);
  };

  const secondaryMatgrpchange = (event) => {
    setSecondarymatgroupselected(event.target.value);
  };

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/mattypes`);
      const json = await result.json();
      setMattypes(json);
    })();
  }, []);

 

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/reqmatcode/${session.user.name}`);
      const json = await result.json();
      setMatcodereq(json);
      console.log(selectedMatflag);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/reqmatcode/chat/${session.user.name}`);
      const json = await result.json();
      setMatcodechat(json);
    })();
  }, []);

  // console.log(matcodereq);

  const handleSave = async (e) => {
    e.preventDefault();
    console.log(
      newdescription,
      longDesc,
      matgroupselected,
      secondarymatgroupselected,
      mattypeselected,
      uom
    );
    let body = {
      mattypeselected,
      matgroupselected,
      secondarymatgroupselected,
      newdescription,
      longDesc,
      user: session.user.name,
      uom,
    };

    const result = await fetch(`/api/reqmatcode`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
    });

    toast.success("new request made succesfully!", {
      position: toast.POSITION.TOP_RIGHT,
    });

    router.reload();
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    console.log(query, session.user.name);
    let body = {
      query: query,
      user: session.user.name,
    };

    const result = await fetch(`/api/reqmatcode/chat`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
      }),
    });
  };

  return (
    <>
      <div className="flex mt-6 justify-center align-middle ml-3">
        {session.user.role == "admin" ||
        session.user.role == "project" ? null : (
          <div className="bg-amber-200 mx-auto w-[90%] min-h-[80vh] min-w-[80vw] p-3">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3/4 h-4/5 col-span-1">
                <Image
                  src="/images/noentry.jpg"
                  width={1200}
                  height={1200}
                  quality={100}
                  priority
                  placeholder="blur"
                  blurDataURL="/images/noentry.jpg"
                  objectFit="contain"
                  alt="notauthorized"
                ></Image>
              </div>
              <div className="col-span-1 py-9">
                <p className="text-[16px] font-bold tracking-widest mb-12">
                  Sorry, you do not have authorization to request new material
                  codes{" "}
                </p>
                <h4 className="bg-sky-800 text-white p-3"> Please mail to <span className="bg-white text-slate-900"> <br /> suresh.n@jalint.com.sa</span> <br />to get access to this page </h4>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* chat section - to be developed*/}

     



      {/* <input
        type="text"
        className="mt-1 px-9 block text-sm w-9/12 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          
        }}
        placeholder="enter your query here...."
      />
      <button type="button" onClick={handleQuery}> Submit </button>

      <div> {JSON.stringify(matcodechat)}</div>
     */}

      {session.user.role == "admin" || session.user.role == "project" ? (
        <div>
          <div className="flex justify-center align-middle bg-teal-600 p-3 mb-5">
            <h3 className="text-white uppercase font font-semibold text-[12px]">
              Welcome{" "}
              <span className="font-black text-[14px] italic">
                {session?.user.name}
              </span>
            </h3>
          </div>

          {/* new request */}
          <div>
            <h3 className="py-3 my-3 mx-auto text-stone-900 italic uppercase font-bold tracking-widest">
              {" "}
              Create NEW request:{" "}
            </h3>
          </div>

          <div className="flex justify-between bg-slate-100 w-full px-3 mx-auto mt-3">
            <h4 className="bg-amber-50 text-stone-800 font-Lato p-1 shadow-md shadow-amber-400 text-[12px]">
              Kindly check existing codes before requesting new code.
            </h4>

            {/* create new request */}

            <h3 className="bg-sky-50 text-zinc-800 font-Lato p-1 shadow-md shadow-sky-400 mx-3 text-[12px]">
              {" "}
              Please use 'Asset' Material type{" "}
              <span className="font-bold italic text-[14px] font-zinc-900">
                {" "}
                (CAPEX){" "}
              </span>
              for Capital assets used for Company-wide purpose, use relevant
              material type for project equipment (those invoiced to client)
            </h3>
            <h3 className="bg-teal-50 text-zinc-800 font-Lato p-1 shadow-md shadow-teal-400 mx-3 text-[12px]">
              {" "}
              Please use 'Channel partner'{" "}
              <span className="font-bold italic text-[14px] font-zinc-900">
                {" "}
                (CHN){" "}
              </span>{" "}
              Material type for current valid OEM's-{" "}
              <span className="font-bold text-[12px] italic">
                {" "}
                GE, MEDC, Federal, Cabur{" "}
              </span>
            </h3>
          </div>
          <div className="border-1 border-slate-800 shadow-md shadow-slate-400 p-3 m-3 bg-slate-200">
            <div className="mt-6">
              <div className="bg-pink-50 grid grid-cols-3 min-h-[105px]">
                <div className="col-span-1">
                  <Listbox
                    as="div"
                    value={selectedMatflag}
                    onChange={setSelectedmatflag}
                  >
                    <Listbox.Label className="uppercase text-[12px] text-slate-800 px-3 font-lato font-bold">
                      Material type:
                    </Listbox.Label>
                    <Listbox.Button className="text-[12px] font-bold text-sky-800 bg-white shadow-md py-1 px-3 shadow-slate-600">
                      {selectedMatflag.name}
                    </Listbox.Button>

                    <Listbox.Options>
                      {matflag.map((mflag) => (
                        <Listbox.Option
                          key={mflag.id}
                          value={mflag}
                          disabled={mflag.inactive}
                          as={Fragment}
                        >
                          {({ active, selected }) => (
                            <li
                              className={`${
                                active
                                  ? "bg-blue-500 text-white w-1/4 text-[12px] p-1 "
                                  : "bg-zinc-100 text-black w-1/4 text-[12px] p-1 "
                              } px-5 ml-3`}
                            >
                              {selected && (
                                <CheckIcon className="h-5 w-5 inline-block" />
                              )}
                              {mflag.type}
                            </li>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
                <div className="col-span-1">
                  {selectedMatflag.id == 1 ? (
                    <p className="text-[10px] text-pink-900 font-bold">
                      <span className="text-green-900 mb-3 border-b-2 border-slate-800">
                        {" "}
                        Please choose any of these material groups only
                      </span>{" "}
                      <br />
                      FURNITURE & FURNISHINGS === AC, WASHING MACHINES,
                      REFRIGERATORS <br />
                      FURNITURE & FURNISHINGS=== TABLE, CHAIRS, CABINETS <br />
                      FURNITURE & FURNISHINGS=== SMALL APPLIANCES <br />
                      FURNITURE & FURNISHINGS=== GYM EQUIPMENTS <br /> <br />
                      MOTORS & GENERATORS === DIESEL GENERATOR SETS & ACC <br />
                      MOTORS & GENERATORS=== MOTORS- AC, DC & ACC <br /> <br />
                      EQUIPMENT & TOOLS === TEST EQUIPMENT <br />
                      MECHANICAL TOOLS === MECHANICAL EQUIPMENT <br />
                      VEHICLE & ACCESSORIES === VEHICLES- LIGHT <br />
                      VEHICLE & ACCESSORIES=== VEHICLES- HEAVY <br /> <br />
                    </p>
                  ) : selectedMatflag.id == 2 ? (
                    <p className="text-[10px] text-cyan-900 font-bold mb-20">
                      <span className="text-green-900 mb-3 border-b-2 border-slate-800">
                        {" "}
                        Please choose any of these material groups only
                      </span>{" "}
                      <br />
                      ANALYZER === TELEDYNE ANALYZERS <br />
                      STROBE LIGHTS & SOUNDERS === STROBE /HORN MEDC <br />
                      GAUGE/INDICATOR === PRESSURE GAUGE- CHANNEL PARTNER <br />
                      GAUGE/INDICATOR === LEVEL GAUGE- CHANNEL PARTNER <br />
                      SENSORS === SENSORS - CHANNEL PARTNER <br /> <br />
                      SENSORS === SENSOR ACCESSORIES- CHANNEL PARTNER <br />
                      SWITCHES ===SWITCHES - CHANNEL PARTNER <br />
                    </p>
                  ) : (
                    <p className="text-[12px] font-bold mb-36">
                      {" "}
                      Use any except those of CAPEX and CHN{" "}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  {selectedMatflag.id == 1 ? (
                    <p className="text-[10px] text-amber-900 font-bold">
                      <span className="text-green-900 mb-3 border-b-2 border-slate-800">
                        {" "}
                        Please choose any of these material groups only
                      </span>{" "}
                      <br />
                      WELDING SETS & ACCESSORIES === WELDING SETS <br />
                      COMPUTERS AND ACCESSORIES === DESKTOPS & LAPTOPS <br />
                      COMPUTERS AND ACCESSORIES=== MONITORS & DISPLAYS <br />{" "}
                      <br />
                      PRINTERS & ACCESSORIES === PRINTERS <br />
                      COMMUNICATION DEVICES === TELEPHONES & EXCHANGES <br />
                      NETWORK & OTHER IT DEVICES === CCTV EQUIPMENT <br />{" "}
                      <br />
                      SOFTWARE === CAPEX SOFTWARE (PERPETUAL LICENSE) <br />
                      TEST & MEASURING INSTRUMENTS === MEASURING EQUIPMENT{" "}
                      <br />
                    </p>
                  ) : selectedMatflag.id == 2 ? (
                    <p className="text-[10px] text-teal-900 font-bold">
                      <span className="text-green-900 mb-3 border-b-2 border-slate-800">
                        {" "}
                        Please choose any of these material groups only
                      </span>{" "}
                      <br />
                      TRANSMITTERS === TRANSMITTERS- CHANNEL PARTNER <br />
                      INSTRUMENT ACCESSORIES === INSTRUMENT ACCESSORIES- CHANNEL
                      PARTNER <br />
                      INSTRUMENT COMMUNICATION DEVICES === GE DEVICES <br />{" "}
                      <br />
                      DETECTORS === DETECTORS- CHANNEL PARTNER <br />
                      INSTRUMENT FILTERS === FILTERS- CHANNEL PARTNER <br />
                      INSTRUMENT GAS === INSTRUMENT GAS- CHANNEL PARTNER <br />
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="shadow-md shadow-zinc-200 bg-zinc-100">
                <div>
                  <div className="grid grid-cols-12 border-b-2 gap-2 py-3 mt-4 mb-6 pb-6">
                    <div className="col-span-3 mx-auto">
                      <label
                        htmlFor="mattypenew"
                        className="block text-[10px] font-bold uppercase text-zinc-600"
                      >
                        Material Type
                      </label>
                      <select
                        id="mattypenew"
                        name="mattypenew"
                        autoComplete="mattypenew"
                        value={mattypeselected}
                        onChange={mattypeChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-Montserrat font-bold text-zinc-900 text-[10px]"
                      >
                        <option
                          value="ZCVL"
                          className="text-zinc-900 text-[10px] font-bold"
                        >
                          ZCVL- Civil Materials
                        </option>
                        <option
                          value="ZMEC"
                          className="text-sky-900 text-[10px] font-bold"
                        >
                          ZMEC- Mechanical/Piping Materials
                        </option>
                        <option
                          value="ZOFC"
                          className="text-sky-900 text-[10px] font-bold"
                        >
                          ZOFC- Office/Camp consumables
                        </option>
                        <option
                          value="ZELC"
                          className="text-sky-900 text-[10px] font-bold"
                        >
                          ZELC- Electrical Materials
                        </option>
                        <option
                          value="ZINS"
                          className="text-sky-900 text-[10px] font-bold"
                        >
                          ZINS- Instrumentation Materials
                        </option>
                      </select>
                    </div>

                    <div className="col-span-3 mx-auto">
                      <label
                        htmlFor="matgroupnew"
                        className="block text-[10px] font-bold uppercase text-zinc-600 px-9"
                      >
                        Material Group-Primary (Corrected)
                      </label>
                      <select
                        id="matgroupnew"
                        name="matgroupnew"
                        autoComplete="matgroupnew"
                        value={matgroupselected}
                        onChange={matgroupChange}
                        className="mt-1 block w-full py-2 px-3 border font-Montserrat font-bold text-stone-900 border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-[10px]"
                      >
                        {mattypes
                          .filter((mt) => mt.materialtype == mattypeselected)
                          .sort((a, b) =>
                            a["matgroupprimary"] > b["matgroupprimary"] ? 1 : -1
                          )
                          .map((item, i) => item["matgroupprimarydesc"])
                          .filter(
                            (value, index, current_val) =>
                              current_val.indexOf(value) === index
                          )
                          .map((mg, idx) => (
                            <option
                              key={idx}
                              value={mg}
                              className="text-[10px] text-sky-900 font-bold"
                            >
                              {mg}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label
                        htmlFor="matgroupsecnew"
                        className="block text-[10px] tracking-wider font-bold uppercase text-zinc-600 px-12"
                      >
                        Material Group-Secondary
                      </label>
                      <select
                        id="matgroupsecnew"
                        name="matgroupsecnew"
                        value={secondarymatgroupselected}
                        onChange={secondaryMatgrpchange}
                        autoComplete="matgroupsec"
                        className="mt-1 block w-3/4 py-2 px-3 border font-Montserrat font-bold text-stone-900 border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-[10px]"
                      >
                        {mattypes
                          .filter(
                            (mt) => mt.matgroupprimarydesc == matgroupselected
                          )
                          .map((mg, idx) => (
                            <option
                              key={idx}
                              value={mg["matgroupsecondarydesc"]}
                              className="text-[10px] text-sky-900 font-bold"
                            >
                              {mg["matgroupsecondarydesc"]}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-span-3 flex flex-col">
                      <label
                        htmlFor="uom"
                        className="block text-[10px] tracking-wider font-bold uppercase text-zinc-600 px-12 mb-2"
                      >
                        {" "}
                        Unit of Measure:
                      </label>
                      <input
                        type="text"
                        className="w-1/2 py-2 text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer placeholder:text-[10px] placeholder:text-gray-600"
                        placeholder="EA/Lot/Box/PAC/...."
                        name="uom"
                        id="uom"
                        value={uom}
                        required
                        onChange={(e) => setUom(e.target.value)}
                      ></input>
                    </div>
                  </div>
                </div>

                {/* placeholders */}

                <div className="bg-zinc-100 pt-1 pl-4">
                  <div className="grid grid-cols-8 gap-2 mt-1">
                    <div className="col-span-2">
                      <div className="relative z-0 w-full mb-2 group">
                        <input
                          type="text"
                          name="primary"
                          id="primary"
                          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                          placeholder=" "
                          required
                          onBlur={(e) => {
                            setNewdescription(
                              (prev, current) =>
                                (current = prev + " " + e.target.value)
                            );
                            setLength(
                              (prev, current) =>
                                (current = prev + e.target.value.length + 1)
                            );
                          }}
                        />
                        <label
                          htmlFor="primary"
                          className="peer-focus:font-medium opacity-50  absolute text-[12px] text-gray-900 font-bold dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          {mattypes
                            .filter(
                              (obj) =>
                                obj["matgroupsecondarydesc"] ===
                                secondarymatgroupselected
                            )
                            .map((ele) => ele["primarydescplaceholder"])}
                        </label>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="relative z-0 w-full mb-2 group">
                        <input
                          type="text"
                          name="secondary"
                          id="secondary"
                          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                          placeholder=" "
                          required
                          onBlur={(e) => {
                            setNewdescription(
                              (prev, current) =>
                                (current = prev + " " + e.target.value)
                            );
                            setLength(
                              (prev, current) =>
                                (current = prev + e.target.value.length + 1)
                            );
                          }}
                        />
                        <label
                          htmlFor="secondary"
                          className="peer-focus:font-medium opacity-30 absolute text-[12px] text-gray-900 font-bold dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          {mattypes
                            .filter(
                              (obj) =>
                                obj["matgroupsecondarydesc"] ===
                                secondarymatgroupselected
                            )
                            .map((ele) => ele["secondarydescplaceholder"])}
                        </label>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="relative z-0 w-full mb-2 group">
                        <input
                          type="text"
                          name="tertiary"
                          id="tertiary"
                          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                          placeholder=" "
                          required
                          onBlur={(e) => {
                            setNewdescription(
                              (prev, current) =>
                                (current = prev + " " + e.target.value)
                            );
                            setLength(
                              (prev, current) =>
                                (current = prev + e.target.value.length + 1)
                            );
                          }}
                        />
                        <label
                          htmlFor="tertiary"
                          className="peer-focus:font-medium opacity-30   absolute text-[12px]  text-gray-900 font-bold dark:text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-sky-800 peer-focus:dark:text-sky-800 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          {mattypes
                            .filter(
                              (obj) =>
                                obj["matgroupsecondarydesc"] ===
                                secondarymatgroupselected
                            )
                            .map((ele) => ele["tertiarydescplaceholder"])}
                        </label>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="relative z-0 w-full mb-2 group">
                        <input
                          type="text"
                          name="other"
                          id="other"
                          className="block py-2.5 px-0 w-3/5 text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                          placeholder=" "
                          required
                          onFocus={() => setMaxlimit(40 - length)}
                          onBlur={(e) => {
                            setNewdescription(
                              (prev, current) =>
                                (current = prev + " " + e.target.value)
                            );
                          }}
                          onChange={(e) => {
                            setLength((prev, current) => (current = prev + 1));
                          }}
                          maxLength={maxLimit}
                        />
                        <label
                          htmlFor="other"
                          className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                        >
                          Other details (Ex. packing size)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="w-11/12 px-6 mb-1 flex flex-col align-middle justify-center  ">
                    <label
                      htmlFor="longtext"
                      className="block text-[10px] font-extrabold uppercase text-stone-900 dark:text-white mb-3"
                    >
                      Large Text Description:{" "}
                    </label>
                    <div className="flex justify-between">
                      <ReactQuill
                        value={longDesc}
                        onChange={(longDesc) => setLongDesc(longDesc)}
                        modules={{
                          toolbar: [
                            ["bold", "italic", "underline"],
                            [{ color: [] }],

                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
                          ],
                        }}
                        theme="snow"
                        className="bg-slate-50 border-2 border-slate-500 min-h-[160px] w-11/12"
                      />
                      <button
                        onClick={handleSave}
                        className="bg-blue-900 text-white rounded-sm p-2 my-auto"
                      >
                        {" "}
                        Request{" "}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* display already made requests */}
          <div>
            <h3 className="py-3 my-3 mx-auto text-stone-900 italic uppercase font-bold tracking-widest">
              {" "}
              Previously created requests:{" "}
            </h3>
            <div className="bg-zinc-100 w-full p-3">
              <table className="w-full  text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-1">
                      Request number:
                    </th>

                    <th scope="col" className="px-1">
                      Brief description & UOM:
                    </th>
                    <th scope="col" className="px-1">
                      Long description
                    </th>
                    <th scope="col" className="px-1">
                      Requested on:
                    </th>
                    <th scope="col" className="px-1">
                      Mat type, Primary Matgroup, Secondary Matgroup
                    </th>
                    <th scope="col" className="px-1">
                      Material code assigned:
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matcodereq.map((mreq, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 ? "bg-red-50" : null
                      } border-b dark:bg-gray-900 dark:border-gray-700`}
                    >
                      <th
                        scope="row"
                        className="font-medium text-gray-900 whitespace-nowrap dark:text-white "
                      >
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold mx-auto">
                          {mreq._id.substr(5, 9)}
                        </p>
                      </th>
                      <th
                        scope="row"
                        className="font-medium text-gray-900 whitespace-nowrap dark:text-white mx-auto"
                      >
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                          {mreq.newdescription}
                        </p>
                        <p className="text-[12px] font-black text-stone-900 font-Montserrat mx-auto">
                          {" "}
                          {mreq.uom}{" "}
                        </p>
                      </th>
                      <th
                        scope="row"
                        className="py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        <p
                          className="text-[12px] text-blue-900 font-Montserrat font-semibold"
                          dangerouslySetInnerHTML={{ __html: mreq.longDesc }}
                        ></p>
                      </th>
                      <th
                        scope="row"
                        className="py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                          {moment(mreq.created_at).format("DD/MM/YYYY")}
                        </p>
                      </th>
                      <th
                        scope="row"
                        className="flex flex-col py-4 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                          {mreq.mattypeselected}
                        </p>
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                          {mreq.matgroupselected}
                        </p>
                        <p className="text-[12px] text-blue-900 font-Montserrat font-semibold">
                          {mreq.secondarymatgroupselected}
                        </p>
                      </th>
                      <th>{mreq.matcode}</th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-36">
      </div>
    </>
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

export default Reqmatcode;
