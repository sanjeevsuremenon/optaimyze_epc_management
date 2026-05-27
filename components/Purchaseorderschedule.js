import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "next-themes";
import { useSession,  } from "next-auth/react";

// Define styles outside the component
const savedFieldStyle = "py-2 px-3 w-1/3 bg-sky-100 border border-sky-200 rounded-md text-gray-700 font-medium cursor-not-allowed select-none shadow-inner";
const savedFieldStyleWide = "py-2 px-3 w-full bg-sky-100 border border-sky-200 rounded-md text-gray-700 font-medium cursor-not-allowed select-none shadow-inner";

function Purchaseorderschedule({ ponumber }) {
  const { data: session } = useSession();

  // Edit states for different sections
  const [editStates, setEditStates] = useState({
    generalData: false,
    paymentData: false,
    bgData: false,
    lcData: false,
    progressData: false,
    shipData: false
  });

  // Helper function to toggle edit states
  const toggleEditState = (section) => {
    setEditStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [poheader, setPoheader] = useState([]);
  const [gendata, setGendata] = useState({});

  // for applicable tag flags
  const [bgtab, setBgtab] = useState(null);
  const [lctab, setLctab] = useState(null);
  const [testing, setTesting] = useState(null);
  const [shipping, setShipping] = useState(null);

  const [bgflagged, setBgflagged] = useState(false);
  const [lcflagged, setLcflagged] = useState(false);
  const [testflagged, setTestflagged] = useState(false);
  const [shipflagged, setShipflagged] = useState(false);

  // gen. PO progress data

  const [poackdate, setPOackdate] = useState(null);
  const [delysch, setDelysch] = useState("");
  const [podelydate, setPodelydate] = useState(null);
  const [estdelydate, setEstdelydate] = useState(null);
  const [basedesignrecdate, setBasedesignrecdate] = useState(null);
  const [basedesignapprdate, setBasedesignapprdate] = useState(null);
  const [basedesigncomments, setBasedesigncomments] = useState("");
  const [generalcomments, setGeneralcomments] = useState("");
  const [detdesignrecdate, setDetdesignrecdate] = useState(null);
  const [detdesignaprdate, setDetdesignaprdate] = useState(null);
  const [mfgclearancedate, setMfgclearancedate] = useState(null);
  const [itpapprdate, setItpapprdate] = useState(null);
  // const [workmilestonecompleted, setWorkmilestonecompleted] = useState(["test"])
  // const [workmilestonecompleteddate, setWorkmilestonecompleteddate] = useState([])
  const [finalworkcompleteddate, setFinalworkcompleteddate] = useState(null);
  const [grdate, setGrdate] = useState(null);

  // payment schedule data

  const [advpaiddate, setAdvpaiddate] = useState(null);
  const [advamountpaid, setAdvamountpaid] = useState("");
  const [milestoneamountpaiddate, setMilestoneamountpaiddate] = useState(null);
  const [milestoneamountpaid, setMilestoneamountpaid] = useState("");
  const [finalpaiddate, setFinalpaiddate] = useState(null);
  const [finalpaidamt, setFinalpaidamt] = useState("");
  const [finalcomments, setFinalpaidcomments] = useState("");
  const [paymentcomments, setPaymentcomments] = useState(""); // Changed from finalcomments

  //Bank guarantee data

  const [abgestdate, setAbgestdate] = useState(null);
  const [abgactualdate, setAbgactualdate] = useState(null);
  const [abgexpirydate, setAbgexpirydate] = useState(null);
  const [abgamount, setAbgamount] = useState(0);
  const [pbgestdate, setPbgestdate] = useState(null);
  const [pbgactualdate, setPbgactualdate] = useState(null);
  const [pbgreturneddate, setPbgreturneddate] = useState(null);
  const [abgreturneddate, setAbgreturneddate] = useState(null);
  const [pbgamount, setPbgamount] = useState(0);
  const [bgremarks, setBgremarks] = useState("");
  const [pbgexpirydate, setPbgexpirydate] = useState(null);

  // L C data

  const [lcestopendate, setLcEstopendate] = useState(null);
  const [lcopeneddate, setLcOpeneddate] = useState(null);
  const [lcdatadate, setLcDatadate] = useState(null);
  const [lclastshipdate, setLcLastshipdate] = useState(null);
  const [lcexpirydate, setLcExpirydate] = useState(null);
  const [lcincoterm, setLcincoterm] = useState("");
  const [lcdocuments, setLcdocuments] = useState("");
  const [lcamount, setLcamount] = useState(0);
  const [lcremarks, setLcremarks] = useState("");
  const [lcswift, setLcswift] = useState("");

  // Progress Milestone data

  const [mfgstart, setMfgstart] = useState(null);
  const [Bldate, setBldate] = useState(null);
  const [Fatdate, setFatdate] = useState(null);
  const [Fatreportdate, setFatreportdate] = useState(null);
  const [vesselreacheddate, setVesselreacheddate] = useState(null);
  const [customscleareddate, setCustomscleareddate] = useState(null);

  // shipment data

  const [shipmentbookeddate, setShipmentbookeddate] = useState(null);
  const [grossweight, setGrossweight] = useState("");
  const [saberapplieddate, setSaberapplieddate] = useState(null);
  const [saberreceiveddate, setSaberreceiveddate] = useState(null);
  const [ffnoMinateddate, setFfnoMinateddate] = useState(null);
  const [finalremarks, setFinalremarks] = useState("");

  const router = useRouter();

  // Initial data loading effects
  useEffect(() => {
    const fetchPurchaserorderlines = async () => {
      const response = await fetch(`/api/purchaseorders/porder/${ponumber}`);
      const json = await response.json();
      setPoheader(json);
    };
    fetchPurchaserorderlines();
  }, [ponumber]);

  useEffect(() => {
    const fetchGeneraldata = async () => {
      const response = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`
      );
      const json = await response.json();
      setGendata(json);

      // Set edit states based on existing data
      setEditStates({
        generalData: !!json?.generaldata,
        paymentData: !!json?.paymentdata,
        bgData: !!json?.bgdata,
        lcData: !!json?.lcdata,
        progressData: !!json?.progressdata,
        shipData: !!json?.shipdata
      });

      // Set General Data states
      if (json?.generaldata) {
        setDelysch(json.generaldata.delysch || "");
        setPOackdate(json.generaldata.poackdate ? new Date(json.generaldata.poackdate) : null);
        setPodelydate(json.generaldata.podelydate ? new Date(json.generaldata.podelydate) : null);
        setEstdelydate(json.generaldata.estdelydate ? new Date(json.generaldata.estdelydate) : null);
        setBasedesignrecdate(json.generaldata.basedesignrecdate ? new Date(json.generaldata.basedesignrecdate) : null);
        setBasedesignapprdate(json.generaldata.basedesignapprdate ? new Date(json.generaldata.basedesignapprdate) : null);
        setBasedesigncomments(json.generaldata.basedesigncomments || "");
        setGeneralcomments(json.generaldata.generalcomments || "");
        setDetdesignrecdate(json.generaldata.detdesignrecdate ? new Date(json.generaldata.detdesignrecdate) : null);
        setDetdesignaprdate(json.generaldata.detdesignaprdate ? new Date(json.generaldata.detdesignaprdate) : null);
        setMfgclearancedate(json.generaldata.mfgclearancedate ? new Date(json.generaldata.mfgclearancedate) : null);
        setItpapprdate(json.generaldata.itpapprdate ? new Date(json.generaldata.itpapprdate) : null);
        setFinalworkcompleteddate(json.generaldata.finalworkcompleteddate ? new Date(json.generaldata.finalworkcompleteddate) : null);
        setGrdate(json.generaldata.grdate ? new Date(json.generaldata.grdate) : null);
      }

      // Set Payment Data states if they exist
      if (json?.paymentdata) {
        setAdvamountpaid(json.paymentdata.advamountpaid || "");
        setAdvpaiddate(json.paymentdata.advpaiddate ? new Date(json.paymentdata.advpaiddate) : null);
        setMilestoneamountpaid(json.paymentdata.milestoneamountpaid || "");
        setMilestoneamountpaiddate(json.paymentdata.milestoneamountpaiddate ? new Date(json.paymentdata.milestoneamountpaiddate) : null);
        setFinalpaidamt(json.paymentdata.finalpaidamt || "");
        setFinalpaiddate(json.paymentdata.finalpaiddate ? new Date(json.paymentdata.finalpaiddate) : null);
        // setFinalcomments(json.paymentdata.finalcomments || "");
        setPaymentcomments(json.paymentdata.paymentcomments || ""); // Changed from finalcomments
      }

      // Set BG Data states
      if (json?.bgdata) {
        setAbgamount(json.bgdata.abgamount || "");
        setAbgactualdate(json.bgdata.abgactualdate ? new Date(json.bgdata.abgactualdate) : null);
        setAbgexpirydate(json.bgdata.abgexpirydate ? new Date(json.bgdata.abgexpirydate) : null);
        setAbgreturneddate(json.bgdata.abgreturneddate ? new Date(json.bgdata.abgreturneddate) : null);
        setPbgamount(json.bgdata.pbgamount || "");
        setPbgestdate(json.bgdata.pbgestdate ? new Date(json.bgdata.pbgestdate) : null);
        setPbgactualdate(json.bgdata.pbgactualdate ? new Date(json.bgdata.pbgactualdate) : null);
        setPbgexpirydate(json.bgdata.pbgexpirydate ? new Date(json.bgdata.pbgexpirydate) : null);
        setPbgreturneddate(json.bgdata.pbgreturneddate ? new Date(json.bgdata.pbgreturneddate) : null);
        setBgremarks(json.bgdata.bgremarks || "");
      }

      // Set LC Data states
      if (json?.lcdata) {
        setLcEstopendate(json.lcdata.lcestopendate ? new Date(json.lcdata.lcestopendate) : null);
        setLcOpeneddate(json.lcdata.lcopeneddate ? new Date(json.lcdata.lcopeneddate) : null);
        setLcDatadate(json.lcdata.lcdatadate ? new Date(json.lcdata.lcdatadate) : null);
        setLcLastshipdate(json.lcdata.lclastshipdate ? new Date(json.lcdata.lclastshipdate) : null);
        setLcExpirydate(json.lcdata.lcexpirydate ? new Date(json.lcdata.lcexpirydate) : null);
        setLcincoterm(json.lcdata.lcincoterm || "");
        setLcdocuments(json.lcdata.lcdocuments || "");
        setLcamount(json.lcdata.lcamount || "");
        setLcremarks(json.lcdata.lcremarks || "");
        setLcswift(json.lcdata.lcswift || "");
      }

      // Set Progress Data states
      if (json?.progressdata) {
        setMfgstart(json.progressdata.mfgstart ? new Date(json.progressdata.mfgstart) : null);
        setBldate(json.progressdata.Bldate ? new Date(json.progressdata.Bldate) : null);
        setFatdate(json.progressdata.Fatdate ? new Date(json.progressdata.Fatdate) : null);
        setFatreportdate(json.progressdata.Fatreportdate ? new Date(json.progressdata.Fatreportdate) : null);
        setVesselreacheddate(json.progressdata.vesselreacheddate ? new Date(json.progressdata.vesselreacheddate) : null);
        setCustomscleareddate(json.progressdata.customscleareddate ? new Date(json.progressdata.customscleareddate) : null);
      }

      // Set Shipment Data states
      if (json?.shipmentdata) {
        setShipmentbookeddate(json.shipmentdata.shipmentbookeddate ? new Date(json.shipmentdata.shipmentbookeddate) : null);
        setGrossweight(json.shipmentdata.grossweight || "");
        setSaberapplieddate(json.shipmentdata.saberapplieddate ? new Date(json.shipmentdata.saberapplieddate) : null);
        setSaberreceiveddate(json.shipmentdata.saberreceiveddate ? new Date(json.shipmentdata.saberreceiveddate) : null);
        setFfnoMinateddate(json.shipmentdata.ffnoMinateddate ? new Date(json.shipmentdata.ffnoMinateddate) : null);
        setFinalremarks(json.shipmentdata.finalremarks || "");
      }
    };

    fetchGeneraldata();
  }, [ponumber]);

  const [activeBlock, setActiveBlock] = useState(null);

  const updateBlockData = (blockName, newData) => {
    switch (blockName) {
      case "generalData":
        setGendata(prevState => ({
          ...prevState,
          generaldata: { ...prevState.generaldata, ...newData }
        }));
        break;
      case "paymentData":
        setGendata(prevState => ({
          ...prevState,
          paymentdata: { ...prevState.paymentdata, ...newData }
        }));
        break;
      // Add cases for other blocks as needed
      case "bgData":
        setGendata(prevState => ({
          ...prevState,
          bgdata: { ...prevState.bgdata, ...newData }
        }));
        break;
      case "lcData":
        setGendata(prevState => ({
          ...prevState,
          lcdata: { ...prevState.lcdata, ...newData }
        }));
        break;
      case "shipData":
        setGendata(prevState => ({
          ...prevState,
          shipdata: { ...prevState.shipdata, ...newData }
        }));
        break;
      default:
        break;
    }
  };

  // General Data Handler
  const handleSubmitGendata = async (e) => {
    e.preventDefault();
    setActiveBlock("generalData");

    const formData = {
      delysch,
      poackdate,
      podelydate,
      estdelydate,
      basedesignrecdate,
      basedesignapprdate,
      basedesigncomments,
      generalcomments,
      detdesignrecdate,
      detdesignaprdate,
      mfgclearancedate,
      itpapprdate,
      finalworkcompleteddate,
      grdate
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.generalData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'generaldata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          generaldata: json.generaldata
        }));
        toggleEditState('generalData');
        toast.success("General data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save general data");
      }
    } catch (error) {
      console.error("Error saving general data:", error);
      toast.error("Error saving general data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  const handleEditGendata = async (e) => {
    e.preventDefault();
    setActiveBlock("generalData");
    const data = {
      poackdate,
      podelydate,
      estdelydate,
      delysch,
      basedesignrecdate,
      basedesignapprdate,
      basedesigncomments,
      generalcomments,
      detdesignrecdate,
      detdesignaprdate,
      mfgclearancedate,
      itpapprdate,
      finalworkcompleteddate,
      grdate,
      advamountpaid,
      advpaiddate,
      milestoneamountpaid,
      milestoneamountpaiddate,
      finalpaiddate,
      finalpaidamt,
      finalcomments,
      abgestdate,
      abgactualdate,
      abgamount,
      abgexpirydate,
      abgreturneddate,
      pbgactualdate,
      pbgestdate,
      pbgreturneddate,
      pbgexpirydate,
      pbgamount,
      bgremarks,
      lcdatadate,
      lcestopendate,
      lcopeneddate,
      lclastshipdate,
      lcexpirydate,
      lcincoterm,
      lcdocuments,
      lcremarks,
      lcamount,
      lcswift,
      lcremarks,
      mfgstart,
      Bldate,
      Fatdate,
      Fatreportdate,
      vesselreacheddate,
      customscleareddate,
      shipmentbookeddate,
      grossweight,
      saberapplieddate,
      saberreceiveddate,
      ffnoMinateddate,
      finalremarks,
      bgtab,
      lctab,
      testing,
      shipping,
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          headers: new Headers({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
        }
      );

      const updatedData = await result.json();
      updateBlockData("generalData", updatedData.generaldata);
      toast.success("Updated successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } catch (error) {
      console.error("Error updating data:", error);
      toast.error("Error updating data. Please try again.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    } finally {
      setActiveBlock(null);
    }
  };

  // Payment Data Handler
  const handleSubmitPaymentdata = async (e) => {
    e.preventDefault();
    setActiveBlock("paymentData");

    const formData = {
      advamountpaid,
      advpaiddate,
      milestoneamountpaid,
      milestoneamountpaiddate,
      finalpaidamt,
      finalpaiddate,
      paymentcomments // Changed from finalcomments
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.paymentData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'paymentdata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          paymentdata: json.paymentdata
        }));
        toggleEditState('paymentData');
        toast.success("Payment data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save payment data");
      }
    } catch (error) {
      console.error("Error saving payment data:", error);
      toast.error("Error saving payment data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  // Bank Guarantee Handler
  const handleSubmitBgdata = async (e) => {
    e.preventDefault();
    setActiveBlock("bgData");

    const formData = {
      abgamount,
      abgactualdate,
      abgexpirydate,
      abgreturneddate,
      pbgamount,
      pbgestdate,
      pbgactualdate,
      pbgexpirydate,
      pbgreturneddate,
      bgremarks
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.bgData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'bgdata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          bgdata: json.bgdata
        }));
        toggleEditState('bgData');
        toast.success("BG data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save BG data");
      }
    } catch (error) {
      console.error("Error saving BG data:", error);
      toast.error("Error saving BG data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  // LC Data Handler
  const handleSubmitLcdata = async (e) => {
    e.preventDefault();
    setActiveBlock("lcData");

    const formData = {
      lcestopendate,
      lcopeneddate,
      lcdatadate,
      lclastshipdate,
      lcexpirydate,
      lcincoterm,
      lcdocuments,
      lcamount,
      lcremarks,
      lcswift
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.lcData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'lcdata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          lcdata: json.lcdata
        }));
        toggleEditState('lcData');
        toast.success("LC data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save LC data");
      }
    } catch (error) {
      console.error("Error saving LC data:", error);
      toast.error("Error saving LC data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  // Progress Data Handler
  const handleSubmitProgressdata = async (e) => {
    e.preventDefault();
    setActiveBlock("progressData");

    const formData = {
      mfgstart,
      Bldate,
      Fatdate,
      Fatreportdate,
      vesselreacheddate,
      customscleareddate
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.progressData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'progressdata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          progressdata: json.progressdata
        }));
        toggleEditState('progressData');
        toast.success("Progress data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save progress data");
      }
    } catch (error) {
      console.error("Error saving progress data:", error);
      toast.error("Error saving progress data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  // Shipment Data Handler
  const handleSubmitShipmentdata = async (e) => {
    e.preventDefault();
    setActiveBlock("shipmentData");

    const formData = {
      shipmentbookeddate,
      grossweight,
      saberapplieddate,
      saberreceiveddate,
      ffnoMinateddate,
      finalremarks
    };

    try {
      const result = await fetch(
        `/api/purchaseorders/schedule/generaldata/${ponumber}`,
        {
          method: editStates.shipmentData ? "PUT" : "POST",
          body: JSON.stringify({
            section: 'shipmentdata',
            formData
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await result.json();
      
      if (result.ok) {
        setGendata(prevData => ({
          ...prevData,
          shipmentdata: json.shipmentdata
        }));
        toggleEditState('shipmentData');
        toast.success("Shipment data saved successfully!");
      } else {
        throw new Error(json.message || "Failed to save shipment data");
      }
    } catch (error) {
      console.error("Error saving shipment data:", error);
      toast.error("Error saving shipment data. Please try again.");
    } finally {
      setActiveBlock(null);
    }
  };

  return (
    <>
      {/* header details */}

      <div>
        {poheader.slice(0, 1).map((row, index) => (
          <div
            key={index}
            className="flex flex-row justify-evenly bg-green-500 p-3 text-white"
          >
            <p> PO Number: {row["po-number"]}</p>
            <p> PO Date: {moment(row["po-date"]).format("DD-MM-YYYY")} </p>
            <p> {row["vendorcode"]}</p>
            <p> {row["vendorname"]}</p>
          </div>
        ))}
      </div>

      {/* Delivery sch details */}
      <form
        onSubmit={!editStates.generalData ? handleSubmitGendata : handleEditGendata}
      >
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden  border-y-2 border-slate-400 rounded-lg shadow-lg  m-9 pt-20 pb-20 dark:bg-gray-600 duration-300 ease-in-out transition-transform transform hover:-translate-y-2">
          <div className="text-[14px] font-italic py-3 px-6  bg-cyan-600 text-white">
            <h3 className="justify-center align-middle">
              {" "}
              General <br /> PO Progress <br /> Data
            </h3>
          </div>

          <div className="flex-1 shadow-xl px-3 bg-cyan-100/70">
            <label
              htmlFor="poackdate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              PO Acknowledgment date:
            </label>
            {gendata?.generaldata?.poackdate ? (
              <div className={savedFieldStyle}>
                {moment(poackdate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={poackdate}
                onChange={(date) => setPOackdate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="podelysch"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Delivery schedule as per PO
            </label>
            {gendata?.generaldata?.delysch ? (
              <div className={savedFieldStyleWide}>
                {delysch}
              </div>
            ) : (
              <input
                type="text"
                name="podelysch"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pb-3 mb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                id="podelysch"
                value={delysch}
                placeholder="e-g ....PO Delivery sch(10 working weeks from drg approval/PO/advance...)"
                onChange={(e) => setDelysch(e.target.value)}
              />
            )}

            <label
              htmlFor="podelysch"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Delivery date as per PO term.
            </label>

            {gendata?.generaldata?.podelydate ? (
              <div className="py-2 px-3 w-1/3 bg-cyan-200 text-stone-800 font-bold">
                {" "}
                {moment(podelydate).format("DD-MM-YYYY")}{" "}
              </div>
            ) : (
              <DatePicker
                className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={podelydate}
                onChange={(date) => setPodelydate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="estdelydate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Estimated delivery date as per current status.
            </label>
            {gendata?.generaldata?.estdelydate ?  (
              // <div className="py-2 px-3 w-1/3 bg-cyan-200 text-stone-800 font-bold">
              //   {" "}
              //   {moment(estdelydate).format("DD-MM-YYYY")}{" "}
              // </div>
              <DatePicker
                className="bg-sky-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={new Date(estdelydate)}
                onChange={(date) => setEstdelydate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
           
            ) : (
              <DatePicker
                className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={new Date(estdelydate)}
                onChange={(date) => setEstdelydate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-cyan-100/70">
            <div className="mb-3 mx-2">
              <label
                htmlFor="basedesignrecdate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Base design received date (from supplier)
              </label>

              {gendata?.generaldata?.basedesignrecdate ? (
                <div className={savedFieldStyle}>
                  {moment(basedesignrecdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={basedesignrecdate}
                  onChange={(date) => setBasedesignrecdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}
            </div>
            <div className="mb-3 mx-2">
              <label
                htmlFor="basedesignapprdate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Base design approval date (from client/proj)
              </label>

              {gendata?.generaldata?.basedesignapprdate ? (
                <div className={savedFieldStyle}>
                  {moment(basedesignapprdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={basedesignapprdate}
                  onChange={(date) => setBasedesignapprdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="basedesigncomments"
                className="block mb-2  mx-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Base design comments, if any
              </label>

              {gendata?.generaldata?.basedesigncomments ? (
                <div className={savedFieldStyleWide}>
                  {basedesigncomments}
                </div>
              ) : (
                <input
                  type="text"
                  name="basedesigncomments"
                  value={basedesigncomments}
                  className="bg-gray-50  px-3  w-4/5 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  pb-24 mb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  id="basedesigncomments"
                  onChange={(e) => setBasedesigncomments(e.target.value)}
                  placeholder=" "
                />
              )}

              {/* New General comments textbox */}
              <label
                htmlFor="generalcomments"
                className="block mb-2  mx-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                General comments
              </label>

              {gendata?.generaldata?.generalcomments ? (
                <div className={savedFieldStyleWide}>
                  {generalcomments}
                </div>
              ) : (
                <input
                  type="text"
                  name="generalcomments"
                  value={generalcomments}
                  className="bg-gray-50  px-3  w-4/5 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  pb-24 mb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  id="generalcomments"
                  onChange={(e) => setGeneralcomments(e.target.value)}
                  placeholder=" "
                />
              )}
            </div>
          </div>

          <div className="flex-1 shadow-xl px-3">
            <div className="bg-cyan-100/70 ml-3 pl-3">
              <label
                htmlFor="detdesignrecdate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Detailed design received date:
              </label>

              {gendata?.generaldata?.detdesignrecdate ? (
                <div className={savedFieldStyle}>
                  {moment(detdesignrecdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={detdesignrecdate}
                  onChange={(date) => setDetdesignrecdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="detdesignapprodate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Detailed Design approval date:
              </label>

              {gendata?.generaldata?.detdesignaprdate ? (
                <div className={savedFieldStyle}>
                  {moment(detdesignaprdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={detdesignaprdate}
                  onChange={(date) => setDetdesignaprdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="mfgclearancedate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Manufacturing clearance issued date:
              </label>
              {gendata?.generaldata?.mfgclearancedate ? (
                <div className={savedFieldStyle}>
                  {moment(mfgclearancedate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={mfgclearancedate}
                  onChange={(date) => setMfgclearancedate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="itpapprdate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                ITP Approval date
              </label>
              {gendata?.generaldata?.itpapprdate ? (
                <div className={savedFieldStyle}>
                  {moment(itpapprdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={itpapprdate}
                  onChange={(date) => setItpapprdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="finalworkcompleteddate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Final work completed date
              </label>
              {gendata?.generaldata?.finalworkcompleteddate ? (
                <div className={savedFieldStyle}>
                  {moment(finalworkcompleteddate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={finalworkcompleteddate}
                  onChange={(date) => setFinalworkcompleteddate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}

              <label
                htmlFor="Grdate"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                GR/SES posted date
              </label>
              {gendata?.generaldata?.grdate ? (
                <div className={savedFieldStyle}>
                  {moment(grdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  className="h-6 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/4 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  selected={grdate}
                  onChange={(date) => setGrdate(date)}
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [5, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                      },
                    },
                  ]}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            onClick={!editStates.generalData ? handleSubmitGendata : handleEditGendata}
            className="absolute p-3 rounded-lg bg-sky-800/10 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-1/3"
            disabled={activeBlock === "generalData"}
          >
            {activeBlock === "generalData" ? "Saving..." : (editStates.generalData ? "Edit" : "Save")}
          </button>
        </div>
      </form>

      {/* payment sch details */}

      <form onSubmit={handleSubmitPaymentdata}>
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden  border-y-2 border-slate-400 rounded-lg shadow-lg  m-9 pt-20 pb-20 dark:bg-gray-600 duration-300 ease-in-out transition-transform transform hover:-translate-y-2">
          <div className="text-[14px] font-italic py-3 px-6  bg-green-600 text-white">
            <h3 className="justify-center align-middle">
              {" "}
              Payment <br /> Schedule <br /> Data
            </h3>
          </div>

          <div className="flex-1 shadow-xl px-3 bg-green-100/70">
            <label htmlFor="advpaiddate" className="block mb-2 text-sm font-medium text-gray-900">
              Advance Paid date
            </label>
            {gendata?.paymentdata?.advpaiddate && editStates.paymentData ? (
              <div className={savedFieldStyle}>
                {moment(advpaiddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                selected={advpaiddate}
                onChange={(date) => setAdvpaiddate(date)}
                dateFormat="dd-MM-yyyy"
              />
            )}

            <label htmlFor="advamountpaid" className="block mb-2 text-sm font-medium text-gray-900">
              Advance Amount paid
            </label>
            {gendata?.paymentdata?.advamountpaid && editStates.paymentData ? (
              <div className={savedFieldStyle}>{advamountpaid}</div>
            ) : (
              <input
                type="text"
                value={advamountpaid}
                onChange={(e) => setAdvamountpaid(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                placeholder="Enter advance amount"
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-green-100/70">
            <label htmlFor="paymentcomments" className="block mb-2 text-sm font-medium text-gray-900">
              Payment Comments
            </label>
            {gendata?.paymentdata?.paymentcomments && editStates.paymentData ? (
              <div className={savedFieldStyle}>{paymentcomments}</div>
            ) : (
              <input
                type="text"
                value={paymentcomments}
                onChange={(e) => setPaymentcomments(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Enter payment comments"
              />
            )}
          </div>

          <button
            type="submit"
            className="absolute p-3 rounded-lg bg-green-800/30 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-1/3"
            disabled={activeBlock === "paymentData"}
          >
            {activeBlock === "paymentData" ? "Saving..." : (editStates.paymentData ? "Edit" : "Save")}
          </button>
        </div>
      </form>

      {/* Bank Guarantee Section */}
      {!bgtab && (
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden border-y-2 border-slate-400 rounded-lg shadow-lg m-9 pt-20 pb-20">
          <div className="text-[14px] font-italic py-3 px-6 bg-sky-600 text-white">
            <h3 className="justify-center align-middle">
              Bank
              <br /> Guarantee
              <br /> Details
            </h3>
            <br />
            <input
              id="bgtabchk"
              type="checkbox"
              onChange={(e) => setBgtab(e.target.value)}
              value="not applicable"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="bgtabchk" className="ml-2 text-sm font-medium text-gray-300">
              Not Applicable
            </label>
          </div>

          {/* Advance BG Section */}
          <div className="flex-1 shadow-xl px-3 bg-sky-100/70">
            <div className="px-3">
              <label htmlFor="abgamount" className="block mb-2 text-sm font-medium text-gray-900">
                Enter Advance BG amount
              </label>
              {gendata?.bgdata?.abgamount ? (
                <div className={savedFieldStyle}>{abgamount}</div>
              ) : (
                <input
                  type="text"
                  name="abgamount"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-1"
                  value={abgamount}
                  onChange={(e) => setAbgamount(e.target.value)}
                  placeholder="e.g. SAR500,000.00"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="abgactualdate" className="block mb-2 text-sm font-medium text-gray-900">
                Advance BG Date of fresh/extended start:
              </label>
              {gendata?.bgdata?.abgactualdate ? (
                <div className={savedFieldStyle}>
                  {moment(abgactualdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={abgactualdate}
                  onChange={(date) => setAbgactualdate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="abgexpirydate" className="block mb-2 text-sm font-medium text-gray-900">
                Advance BG Date of expiry
              </label>
              {gendata?.bgdata?.abgexpirydate ? (
                <div className={savedFieldStyle}>
                  {moment(abgexpirydate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={abgexpirydate}
                  onChange={(date) => setAbgexpirydate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>
          </div>

          {/* Performance BG Section */}
          <div className="flex-1 shadow-xl px-3 bg-sky-100/70">
            <div className="px-3">
              <label htmlFor="pbgestdate" className="block mb-2 text-sm font-medium text-gray-900">
                Performance BG Date estimated as per PO term
              </label>
              {gendata?.bgdata?.pbgestdate ? (
                <div className={savedFieldStyle}>
                  {moment(pbgestdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={pbgestdate}
                  onChange={(date) => setPbgestdate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="pbgamount" className="block mb-2 text-sm font-medium text-gray-900">
                Enter Performance BG amount
              </label>
              {gendata?.bgdata?.pbgamount ? (
                <div className={savedFieldStyle}>{pbgamount}</div>
              ) : (
                <input
                  type="text"
                  name="pbgamount"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5"
                  value={pbgamount}
                  onChange={(e) => setPbgamount(e.target.value)}
                  placeholder="e.g. SAR500,000.00"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="pbgactualdate" className="block mb-2 text-sm font-medium text-gray-900">
                Performance BG Date fresh/extended start:
              </label>
              {gendata?.bgdata?.pbgactualdate ? (
                <div className={savedFieldStyle}>
                  {moment(pbgactualdate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={pbgactualdate}
                  onChange={(date) => setPbgactualdate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="pbgexpirydate" className="block mb-2 text-sm font-medium text-gray-900">
                Performance BG Expiry date:
              </label>
              {gendata?.bgdata?.pbgexpirydate ? (
                <div className={savedFieldStyle}>
                  {moment(pbgexpirydate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={pbgexpirydate}
                  onChange={(date) => setPbgexpirydate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>
          </div>

          {/* BG Returns Section */}
          <div className="flex-1 shadow-xl px-3 bg-sky-100/70">
            <div className="px-3">
              <label htmlFor="abgreturneddate" className="block mb-2 text-sm font-medium text-gray-900">
                ABG returned/extinguished date:
              </label>
              {gendata?.bgdata?.abgreturneddate ? (
                <div className={savedFieldStyle}>
                  {moment(abgreturneddate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={abgreturneddate}
                  onChange={(date) => setAbgreturneddate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="pbgreturneddate" className="block mb-2 text-sm font-medium text-gray-900">
                PBG returned/extinguished date:
              </label>
              {gendata?.bgdata?.pbgreturneddate ? (
                <div className={savedFieldStyle}>
                  {moment(pbgreturneddate).format("DD-MM-YYYY")}
                </div>
              ) : (
                <DatePicker
                  selected={pbgreturneddate}
                  onChange={(date) => setPbgreturneddate(date)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6"
                  dateFormat="dd-MM-yyyy"
                />
              )}
            </div>

            <div className="px-3">
              <label htmlFor="bgremarks" className="block mb-2 text-sm font-medium text-gray-900">
                Remarks on BG's:
              </label>
              {gendata?.bgdata?.bgremarks ? (
                <div className={savedFieldStyleWide}>{bgremarks}</div>
              ) : (
                <input
                  type="text"
                  name="bgremarks"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pb-20 mb-6"
                  value={bgremarks}
                  onChange={(e) => setBgremarks(e.target.value)}
                  placeholder="e.g. bank name which issued BG/ any free text comment"
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitBgdata}
            className="absolute p-3 rounded-lg bg-sky-800/10 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-1/3"
            disabled={activeBlock === "bgData"}
          >
            {activeBlock === "bgData" ? "Saving..." : (editStates.bgData ? "Edit" : "Save")}
          </button>
        </div>
      )}

      {/* L/C details */}

      {lcflagged ? null : (
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden  border-y-2 border-slate-400 rounded-lg shadow-lg  m-9 pt-44 pb-28 dark:bg-gray-600 duration-300 ease-in-out transition-transform transform hover:-translate-y-2">
          <div className="text-[14px] font-italic py-3 px-6  bg-purple-600 text-white">
            <h3 className="justify-center align-middle">
              {" "}
              Letter of Credit
              <br /> Data{" "}
            </h3>
            <br />

            <input
                id="lctabchk"
                type="checkbox"
                onChange={(e) => setLctab(e.target.value)}
                value="not applicable"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="lctabchk"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Not Applicable
              </label>
          </div>

          <div className="flex-1 shadow-xl px-3 bg-purple-100/70">
            <label
              htmlFor="lcestopendate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Open date estimated:{" "}
            </label>

            {gendata?.lcdata?.lcestopendate ? (
              <div className={savedFieldStyleWide}>
                {moment(lcestopendate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={lcestopendate}
                onChange={(date) => setLcEstopendate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="lcincoterm"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              L C Incoterm:{" "}
            </label>

            {gendata?.lcdata?.lcincoterm ? (
              <div className={savedFieldStyleWide}>
                {lcincoterm}
              </div>
            ) : (
              <input
                type="text"
                id="lcincoterm"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="CIF/DDP/Ex-w..."
                value={lcincoterm}
                onChange={(e) => setLcincoterm(e.target.value)}
              />
            )}

            <label
              htmlFor="lcamount"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Enter L/C Amount
            </label>

            {gendata?.lcdata?.lcamount ? (
              <div className={savedFieldStyleWide}>
                {lcamount}
              </div>
            ) : (
              <input
                type="text"
                name="lcamount"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                id="lcamount"
                // pattern="^\$\d{1,3}(,\d{3})*(\.\d+)?$"
                value={lcamount}
                // data-type="currency"
                onChange={(e) => setLcamount(e.target.value)}
                placeholder="SAR500,000.00"
              />
            )}
          </div>
          <div className="flex-1 shadow-xl px-3 bg-purple-100/70">
            <label
              htmlFor="lcdocuments"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Documents:{" "}
            </label>

            {gendata?.lcdata?.lcdocuments ? (
              <div className={savedFieldStyleWide}>
                {lcdocuments}
              </div>
            ) : (
              <input
                type="text"
                id="lcdocuments"
                value={lcdocuments}
                onChange={(e) => setLcdocuments(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-3/4  p-2.5 pb-3 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Original Invoice/Bill of Lading/..."
              />
            )}

            <label
              htmlFor="lcdatadate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC data requested & received from supplier:
            </label>

            {gendata?.lcdata?.lcdatadate ? (
              <div className={savedFieldStyleWide}>
                {moment(lcdatadate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={lcdatadate}
                onChange={(date) => setLcDatadate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="lcopeneddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC opened date: (swift advice from bank)
            </label>

            {gendata?.lcdata?.lcopeneddate ? (
              <div className={savedFieldStyleWide}>
                {moment(lcopeneddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border  border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={lcopeneddate}
                popperPlacement="top-start"
                DayPickerInput-Overlay
                onChange={(date) => setLcOpeneddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-purple-100/70">
            <label
              htmlFor="lcswift"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Swift Number & Bank:
            </label>

            {gendata?.lcdata?.lcswift ? (
              <div className={savedFieldStyleWide}>
                {lcswift}
              </div>
            ) : (
              <input
                type="text"
                id="lcswift"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 pb-3 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Original Invoice/Bill of Lading/..."
                value={lcswift}
                onChange={(e) => setLcswift(e.target.value)}
              />
            )}

            <label
              htmlFor="lclastshipdate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Last shipment date:
            </label>

            {gendata?.lcdata?.lclastshipdate ? (
              <div className={savedFieldStyleWide}>
                {moment(lclastshipdate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={lclastshipdate}
                popperPlacement="top-start"
                onChange={(date) => setLcLastshipdate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="lcexpirydate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Expiry Date:
            </label>

            {gendata?.lcdata?.lcexpirydate ? (
              <div className={savedFieldStyleWide}>
                {moment(lcexpirydate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={lcexpirydate}
                popperPlacement="top-start"
                onChange={(date) => setLcExpirydate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-purple-100/70">
            <label
              htmlFor="lcremarks"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LC Remarks
            </label>

            {gendata?.lcdata?.lcremarks ? (
              <div className={savedFieldStyleWide}>
                {lcremarks}
              </div>
            ) : (
              <input
                type="textarea"
                id="lcremarks"
                className="bg-gray-50 border border-gray-300 pb-64 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-1/2 p-2.5  mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Any free text remarks by JAL Fin / Proj/ MMD/..."
                value={lcremarks}
                onChange={(e) => setLcremarks(e.target.value)}
              />
            )}
          </div>
          <button
            type="submit"
            onClick={!editStates.generalData ? handleSubmitGendata : handleEditGendata}
            className="absolute p-3 rounded-lg bg-purple-800/30 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-2/3"
            disabled={activeBlock === "generalData"}
          >
            {activeBlock === "generalData" ? "Saving..." : (editStates.generalData ? "Edit" : "Save")}
          </button>
        </div>
      )}

      {/* progress milestones */}

      {testflagged ? null : (
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden  border-y-2 border-slate-400 rounded-lg shadow-lg  m-9 pt-20 pb-20 dark:bg-gray-600 duration-300 ease-in-out transition-transform transform hover:-translate-y-2">
          <div className="text-[14px] font-italic py-3 px-6  bg-fuchsia-600 text-white">
            <h3 className="justify-center align-middle">
              {" "}
              Progress <br /> Milestones
              <br /> Data
            </h3>
            <br />
            <input
                id="testingtabchk"
                type="checkbox"
                onChange={(e) => setTesting(e.target.value)}
                value="not applicable"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="testingtabchk"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Not Applicable
              </label>
          </div>

          <div className="flex-1 shadow-xl px-3 bg-fuchsia-100/70">
            <label
              htmlFor="mfgstart"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Actual Manufacturing start Date:
            </label>

            {gendata?.progressdata?.mfgstart ? (
              <div className={savedFieldStyle}>
                {moment(mfgstart).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={mfgstart}
                onChange={(date) => setMfgstart(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="Fatdate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              FAT/Final inspection date:
            </label>

            {gendata?.progressdata?.Fatdate ? (
              <div className={savedFieldStyle}>
                {moment(Fatdate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={Fatdate}
                onChange={(date) => setFatdate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-fuchsia-100/70">
            <label
              htmlFor="Fatreportdate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              TPI /Final inspection report received date:
            </label>

            {gendata?.progressdata?.Fatreportdate ? (
              <div className={savedFieldStyle}>
                {moment(Fatreportdate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={Fatreportdate}
                onChange={(date) => setFatreportdate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="Bldate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              B/L/ AWB booked date
            </label>

            {gendata?.progressdata?.Bldate ? (
              <div className={savedFieldStyle}>
                {moment(Bldate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={Bldate}
                onChange={(date) => setBldate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-fuchsia-100/70">
            <label
              htmlFor="vesselreacheddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Flight/vessel reached date
            </label>

            {gendata?.progressdata?.vesselreacheddate ? (
              <div className={savedFieldStyle}>
                {moment(vesselreacheddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={vesselreacheddate}
                onChange={(date) => setVesselreacheddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="customscleareddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Customs cleared/ Bayyan paid date
            </label>

            {gendata?.progressdata?.customscleareddate ? (
              <div className={savedFieldStyle}>
                {moment(customscleareddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={customscleareddate}
                onChange={(date) => setCustomscleareddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>
          <button
            type="submit"
            onClick={!editStates.generalData ? handleSubmitGendata : handleEditGendata}
            className="absolute p-3 rounded-lg bg-fuchsia-800/30 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-1/2"
            disabled={activeBlock === "generalData"}
          >
            {activeBlock === "generalData" ? "Saving..." : (editStates.generalData ? "Edit" : "Save")}
          </button>
        </div>
      )}

      {/* Packing & Shipment details */}

      {shipflagged ? null : (
        <div className="relative py-6 mb-3 flex gap-1 overflow-hidden  border-y-2 border-slate-400 rounded-lg shadow-lg  m-9 pt-20 pb-20 dark:bg-gray-600 duration-300 ease-in-out transition-transform transform hover:-translate-y-2">
          <div className="text-[14px] font-italic py-3 px-6  bg-amber-600 text-white">
            <h3 className="justify-center align-middle">
              {" "}
              Packing & <br /> Shipment <br /> Related <br /> Data (for
              Ex-works only)
            </h3>

            <br /> 

            <input
                id="shiptabchk"
                type="checkbox"
                onChange={(e) => setShipping(e.target.value)}
                value="not applicable"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="shiptabchk"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Not Applicable
              </label>
          </div>

          <div className="flex-1 shadow-xl px-3 bg-amber-100/70">
            <label
              htmlFor="dimensions"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Gross weight/dimensions (appx) in KG/Metric dimensions
            </label>

            {gendata?.shipdata?.grossweight ? (
              <div className={savedFieldStyle}>
                {grossweight}
              </div>
            ) : (
              <input
                type="text"
                id="dimensions"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 pb-3 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Gross weight (Kg) and dimensions (Metric)/..."
                value={grossweight}
                onChange={(e) => setGrossweight(e.target.value)}
              />
            )}

            <label
              htmlFor="shipmentbookedddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Shipment is booked on:
            </label>

            {gendata?.shipdata?.shipmentbookeddate ? (
              <div className={savedFieldStyle}>
                {moment(shipmentbookeddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={shipmentbookeddate}
                onChange={(date) => setShipmentbookeddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-amber-100/70">
            <label
              htmlFor="saberapplieddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              SABER applied on:
            </label>

            {gendata?.shipdata?.saberapplieddate ? (
              <div className={savedFieldStyle}>
                {moment(saberapplieddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={saberapplieddate}
                onChange={(date) => setSaberapplieddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="saberreceiveddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              SABER received on:
            </label>

            {gendata?.shipdata?.saberreceiveddate ? (
              <div className={savedFieldStyle}>
                {moment(saberreceiveddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={saberreceiveddate}
                onChange={(date) => setSaberreceiveddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="flex-1 shadow-xl px-3 bg-amber-100/70">
            <label
              htmlFor="ffnominateddate"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Freight forwarder nominated on
            </label>

            {gendata?.shipdata?.ffnoMinateddate ? (
              <div className={savedFieldStyle}>
                {moment(ffnoMinateddate).format("DD-MM-YYYY")}
              </div>
            ) : (
              <DatePicker
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-1/2 p-2.5 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                selected={ffnoMinateddate}
                onChange={(date) => setFfnoMinateddate(date)}
                popperModifiers={[
                  {
                    name: "offset",
                    options: {
                      offset: [5, 10],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      rootBoundary: "viewport",
                      tether: false,
                      altAxis: true,
                    },
                  },
                ]}
              />
            )}

            <label
              htmlFor="finalremarks"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              FINAL REMARKS ON PO:
            </label>

            {gendata?.shipdata?.finalremarks ? (
              <div className={savedFieldStyle}>
                {finalremarks}
              </div>
            ) : (
              <input
                type="text"
                id="finalremarks"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pb-28 mb-6  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="FINAL REMARKS IF ANY..."
                value={finalremarks}
                onChange={(e) => setFinalremarks(e.target.value)}
              />
            )}
          </div>

          <button
            type="submit"
            onClick={!editStates.generalData ? handleSubmitGendata : handleEditGendata}
            className="absolute p-3 rounded-lg bg-amber-800/30 shadow-lg shadow-slate-500 text-sm text-slate-800 font-bold right-5 top-1/2"
            disabled={activeBlock === "generalData"}
          >
            {activeBlock === "generalData" ? "Saving..." : (editStates.generalData ? "Edit" : "Save")}
          </button>
        </div>
      )}
    </>
  );
}

export default Purchaseorderschedule;
