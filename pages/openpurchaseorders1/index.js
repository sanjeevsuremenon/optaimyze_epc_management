import React, { useState, useEffect } from "react";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import { FiSearch, FiArrowUp, FiArrowDown, FiMessageSquare, FiCalendar, FiEye } from 'react-icons/fi';
import dynamic from "next/dynamic";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from 'date-fns';
import { useRouter } from 'next/router';

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

// Import PO Schedule components
import GeneralPOData from '../../components/POSchedule/GeneralPOData';
import PaymentScheduleData from '../../components/POSchedule/PaymentScheduleData';
import BankGuaranteeData from '../../components/POSchedule/BankGuaranteeData';
import LCData from '../../components/POSchedule/LCData';
import ProgressMilestoneData from '../../components/POSchedule/ProgressMilestoneData';
import ShipmentData from '../../components/POSchedule/ShipmentData';

const PO_MILESTONE_ROWS = [
  { key: 'baseDesignSubmittal', label: 'Base design submittal', daysFromPo: 14 },
  { key: 'baseDesignApproval', label: 'Base design approval', daysFromPo: 28 },
  { key: 'detailedDesignSubmittal', label: 'Detailed design submittal', daysFromPo: 45 },
  { key: 'detailedDesignApproval', label: 'Detailed design approval', daysFromPo: 60 },
  { key: 'manufacturingClearance', label: 'Manufacturing clearance', daysFromPo: 28 },
  { key: 'itpApproval', label: 'ITP approval', daysFromPo: 90 },
];

const EMPTY_MILESTONE_ACTUALS = {
  baseDesignSubmittal: null,
  baseDesignApproval: null,
  detailedDesignSubmittal: null,
  detailedDesignApproval: null,
  manufacturingClearance: null,
  itpApproval: null,
};

function isScheduleMilestonesEligible(po) {
  if (!po) return false;
  const v = Number(po.povalue);
  return !Number.isNaN(v) && v > 100000;
}

function Openpurchaseorders1() {
  const { data: session } = useSession();
  const router = useRouter();
  const [openpolist, setOpenpolist] = useState([]);
  const [poschfilled, setPoschfilled] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'po-date',
    direction: 'desc'
  });
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedSchedulePo, setSelectedSchedulePo] = useState(null);
  const [milestoneActuals, setMilestoneActuals] = useState(() => ({ ...EMPTY_MILESTONE_ACTUALS }));
  const [comments, setComments] = useState([]);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState('general');

  // Schedule form states
  const [poackdate, setPOackdate] = useState(null);
  const [podelydate, setPodelydate] = useState(null);
  const [estdelydate, setEstdelydate] = useState(null);
  const [delysch, setDelysch] = useState("");
  const [basedesignrecdate, setBasedesignrecdate] = useState(null);
  const [basedesignapprdate, setBasedesignapprdate] = useState(null);
  const [basedesigncomments, setBasedesigncomments] = useState("");
  const [generalcomments, setGeneralcomments] = useState("");
  const [detdesignrecdate, setDetdesignrecdate] = useState(null);
  const [detdesignaprdate, setDetdesignaprdate] = useState(null);
  const [mfgclearancedate, setMfgclearancedate] = useState(null);
  const [itpapprdate, setItpapprdate] = useState(null);
  const [finalworkcompleteddate, setFinalworkcompleteddate] = useState(null);
  const [grdate, setGrdate] = useState(null);

  // Payment schedule states (date = paid date; requesteddate stored as requesteddate in MongoDB)
  const [advancePayments, setAdvancePayments] = useState([
    { requesteddate: null, date: null, amount: "", remarks: "", id: 1 }
  ]);
  const [milestonePayments, setMilestonePayments] = useState([
    { requesteddate: null, date: null, amount: "", remarks: "", id: 1 }
  ]);
  const [finalPayment, setFinalPayment] = useState({
    requesteddate: null,
    date: null,
    amount: "",
    comments: ""
  });

  // Bank guarantee states
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

  // LC states
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

  // Inspection (ITP / TPI) — stored as inspectiondata on poschedule
  const [itpSubmittedDate, setItpSubmittedDate] = useState(null);
  const [itpApprovedDate, setItpApprovedDate] = useState(null);
  const [tpiRequestedDate, setTpiRequestedDate] = useState(null);
  const [tpiPoIssuedDate, setTpiPoIssuedDate] = useState(null);
  const [tpiPoNumber, setTpiPoNumber] = useState("");
  const [fatInspectionDate, setFatInspectionDate] = useState(null);
  const [tpiDraftReportReceivedDate, setTpiDraftReportReceivedDate] = useState(null);
  const [tpiReportApprovedDate, setTpiReportApprovedDate] = useState(null);

  // Progress milestone states
  const [mfgstart, setMfgstart] = useState(null);
  const [Bldate, setBldate] = useState(null);
  const [Fatdate, setFatdate] = useState(null);
  const [Fatreportdate, setFatreportdate] = useState(null);
  const [vesselreacheddate, setVesselreacheddate] = useState(null);
  const [customscleareddate, setCustomscleareddate] = useState(null);

  // Shipping states
  const [shipmentbookeddate, setShipmentbookeddate] = useState(null);
  const [grossweight, setGrossweight] = useState("");
  const [saberapplieddate, setSaberapplieddate] = useState(null);
  const [saberreceiveddate, setSaberreceiveddate] = useState(null);
  const [ffnoMinateddate, setFfnoMinateddate] = useState(null);
  const [finalremarks, setFinalremarks] = useState("");

  // Helper functions for payment management
  const addAdvancePayment = () => {
    setAdvancePayments([
      ...advancePayments,
      { requesteddate: null, date: null, amount: "", remarks: "", id: advancePayments.length + 1 }
    ]);
  };

  const removeAdvancePayment = (id) => {
    setAdvancePayments(advancePayments.filter(payment => payment.id !== id));
  };

  const updateAdvancePayment = (id, field, value) => {
    setAdvancePayments(advancePayments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  const addMilestonePayment = () => {
    setMilestonePayments([
      ...milestonePayments,
      { requesteddate: null, date: null, amount: "", remarks: "", id: milestonePayments.length + 1 }
    ]);
  };

  const removeMilestonePayment = (id) => {
    setMilestonePayments(milestonePayments.filter(payment => payment.id !== id));
  };

  const updateMilestonePayment = (id, field, value) => {
    setMilestonePayments(milestonePayments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  // Fetch open POs
  useEffect(() => {
    const fetchOpenPOs = async () => {
      setLoading(true);
      try {
        const result = await fetch(`/api/purchaseorders/openpo`);
        const json = await result.json();
        setOpenpolist(
          json.filter(
            (row) =>
              row.openvalue > 10 &&
              row._id["po-number"].substring(0, 2) !== "47" &&
              row._id["po-number"].substring(0, 2) !== "71" &&
              row._id["po-number"].substring(0, 2) !== "91"
          )
        );
      } catch (error) {
        console.error('Error fetching open POs:', error);
      }
      setLoading(false);
    };

    fetchOpenPOs();
  }, []);

  // Fetch PO schedule data
  useEffect(() => {
    const fetchPOSchedule = async () => {
      try {
        const result = await fetch(`/api/purchaseorders/poschedulefilled`);
        const json = await result.json();
        setPoschfilled(json);
      } catch (error) {
        console.error('Error fetching PO schedule:', error);
      }
    };

    fetchPOSchedule();
  }, []);

  useEffect(() => {
    if (!showScheduleModal) {
      setSelectedSchedulePo(null);
    }
  }, [showScheduleModal]);

  useEffect(() => {
    if (
      showScheduleModal &&
      selectedSchedulePo &&
      !isScheduleMilestonesEligible(selectedSchedulePo) &&
      activeTab === 'milestones'
    ) {
      setActiveTab('general');
    }
  }, [showScheduleModal, selectedSchedulePo, activeTab]);

  // Sort and filter data
  const sortedAndFilteredData = React.useMemo(() => {
    let filteredData = [...openpolist];
    
    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item => 
        item._id["po-number"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id.vendorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id.vendorcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a._id[sortConfig.key];
        let bValue = b._id[sortConfig.key];
        
        if (sortConfig.key === 'openvalue') {
          aValue = a.openvalue;
          bValue = b.openvalue;
        } else if (sortConfig.key === 'povalue') {
          aValue = a.povalue || 0;
          bValue = b.povalue || 0;
        } else if (sortConfig.key === 'po-date') {
          aValue = a['po-date'] ? new Date(a['po-date']) : null;
          bValue = b['po-date'] ? new Date(b['po-date']) : null;
          // Handle null dates
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;
        } else if (sortConfig.key === 'delivery-date') {
          aValue = a['delivery-date'] ? new Date(a['delivery-date']) : null;
          bValue = b['delivery-date'] ? new Date(b['delivery-date']) : null;
          // Handle null dates
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [openpolist, searchTerm, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  // Handle comment modal
  const handleCommentClick = async (ponumber) => {
    setSelectedPO(ponumber);
    try {
      const result = await fetch(`/api/purchaseorders/openpo/comments/${ponumber}`);
      const json = await result.json();
      setComments(json);
      setShowCommentModal(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/purchaseorders/openpo/comments/${selectedPO}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          comment,
          user: session.user.name,
        }),
      });

      if (response.ok) {
        toast.success('Comment added successfully!');
        setTitle('');
        setComment('');
        // Refresh comments
        const result = await fetch(`/api/purchaseorders/openpo/comments/${selectedPO}`);
        const json = await result.json();
        setComments(json);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Handle schedule submission
  const handleScheduleSubmit = async () => {
    try {
      const formData = {
        generaldata: {
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
          grdate
        },
        paymentdata: {
          advancePayments,
          milestonePayments,
          finalPayment
        },
        bgdata: {
          abgestdate,
          abgactualdate,
          abgexpirydate,
          abgamount,
          pbgestdate,
          pbgactualdate,
          pbgreturneddate,
          abgreturneddate,
          pbgamount,
          bgremarks,
          pbgexpirydate
        },
        lcdata: {
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
        },
        inspectiondata: {
          itpSubmittedDate,
          itpApprovedDate,
          tpiRequestedDate,
          tpiPoIssuedDate,
          tpiPoNumber,
          fatInspectionDate,
          tpiDraftReportReceivedDate,
          tpiReportApprovedDate
        },
        progressdata: {
          mfgstart,
          Bldate,
          Fatdate,
          Fatreportdate,
          vesselreacheddate,
          customscleareddate
        },
        shipdata: {
          shipmentbookeddate,
          grossweight,
          saberapplieddate,
          saberreceiveddate,
          ffnoMinateddate,
          finalremarks
        }
      };

      console.log('Submitting schedule data for PO:', selectedPO);
      console.log('Form data:', formData);

      const response = await fetch(`/api/purchaseorders/schedule/generaldata/${selectedPO}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user: session.user.name
        }),
      });

      const result = await response.json();
      console.log('Submit response:', result);

      if (response.ok) {
        if (isScheduleMilestonesEligible(selectedSchedulePo)) {
          const milestonePayload = {
            actuals: {
              baseDesignSubmittal: milestoneActuals.baseDesignSubmittal
                ? milestoneActuals.baseDesignSubmittal.toISOString()
                : null,
              baseDesignApproval: milestoneActuals.baseDesignApproval
                ? milestoneActuals.baseDesignApproval.toISOString()
                : null,
              detailedDesignSubmittal: milestoneActuals.detailedDesignSubmittal
                ? milestoneActuals.detailedDesignSubmittal.toISOString()
                : null,
              detailedDesignApproval: milestoneActuals.detailedDesignApproval
                ? milestoneActuals.detailedDesignApproval.toISOString()
                : null,
              manufacturingClearance: milestoneActuals.manufacturingClearance
                ? milestoneActuals.manufacturingClearance.toISOString()
                : null,
              itpApproval: milestoneActuals.itpApproval
                ? milestoneActuals.itpApproval.toISOString()
                : null,
            },
            user: session.user.name,
            poIssueDate: selectedSchedulePo['po-date'] ?? null,
            povalue: selectedSchedulePo.povalue,
          };
          const mRes = await fetch(`/api/purchaseorders/schedule/milestones/${selectedPO}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(milestonePayload),
          });
          if (!mRes.ok) {
            const mErr = await mRes.json().catch(() => ({}));
            toast.warn(mErr.message || 'Schedule saved, but milestone dates could not be saved.');
          }
        }
        toast.success('Schedule updated successfully!');
        setShowScheduleModal(false);
      } else {
        throw new Error(result.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  // Handle schedule click
  const handleScheduleClick = async (po) => {
    if (!po || !po._id || !po._id['po-number']) {
      console.error('Invalid PO data:', po);
      toast.error('Invalid PO data');
      return;
    }

    const poNumber = po._id['po-number'];
    console.log('Opening schedule for PO:', poNumber);
    setSelectedPO(poNumber);
    setSelectedSchedulePo(po);
    setShowScheduleModal(true);

    const loadMilestoneActuals = async () => {
      if (!isScheduleMilestonesEligible(po)) {
        setMilestoneActuals({ ...EMPTY_MILESTONE_ACTUALS });
        return;
      }
      try {
        const mr = await fetch(`/api/purchaseorders/schedule/milestones/${poNumber}`);
        const mdata = await mr.json();
        if (mdata && mdata.actuals) {
          setMilestoneActuals({
            baseDesignSubmittal: mdata.actuals.baseDesignSubmittal
              ? parseISO(mdata.actuals.baseDesignSubmittal)
              : null,
            baseDesignApproval: mdata.actuals.baseDesignApproval
              ? parseISO(mdata.actuals.baseDesignApproval)
              : null,
            detailedDesignSubmittal: mdata.actuals.detailedDesignSubmittal
              ? parseISO(mdata.actuals.detailedDesignSubmittal)
              : null,
            detailedDesignApproval: mdata.actuals.detailedDesignApproval
              ? parseISO(mdata.actuals.detailedDesignApproval)
              : null,
            manufacturingClearance: mdata.actuals.manufacturingClearance
              ? parseISO(mdata.actuals.manufacturingClearance)
              : null,
            itpApproval: mdata.actuals.itpApproval ? parseISO(mdata.actuals.itpApproval) : null,
          });
        } else {
          setMilestoneActuals({ ...EMPTY_MILESTONE_ACTUALS });
        }
      } catch (e) {
        console.error('Error loading milestone actuals:', e);
        setMilestoneActuals({ ...EMPTY_MILESTONE_ACTUALS });
      }
    };

    try {
      const response = await fetch(`/api/purchaseorders/schedule/generaldata/${poNumber}`);
      
      if (response.status === 404) {
        // Reset all fields to their initial state
        setPOackdate(null);
        setPodelydate(null);
        setEstdelydate(null);
        setDelysch('');
        setBasedesignrecdate(null);
        setBasedesignapprdate(null);
        setBasedesigncomments('');
        setGeneralcomments('');
        setDetdesignrecdate(null);
        setDetdesignaprdate(null);
        setMfgclearancedate(null);
        setItpapprdate(null);
        setFinalworkcompleteddate(null);
        setGrdate(null);
        setAdvancePayments([{ requesteddate: null, date: null, amount: '', remarks: '', id: 1 }]);
        setMilestonePayments([{ requesteddate: null, date: null, amount: '', remarks: '', id: 1 }]);
        setFinalPayment({ requesteddate: null, date: null, amount: '', comments: '' });
        setAbgestdate(null);
        setAbgactualdate(null);
        setAbgexpirydate(null);
        setAbgamount(0);
        setPbgestdate(null);
        setPbgactualdate(null);
        setPbgreturneddate(null);
        setAbgreturneddate(null);
        setPbgamount(0);
        setBgremarks('');
        setPbgexpirydate(null);
        setLcEstopendate(null);
        setLcOpeneddate(null);
        setLcDatadate(null);
        setLcLastshipdate(null);
        setLcExpirydate(null);
        setLcincoterm('');
        setLcdocuments('');
        setLcamount(0);
        setLcremarks('');
        setLcswift('');
        setItpSubmittedDate(null);
        setItpApprovedDate(null);
        setTpiRequestedDate(null);
        setTpiPoIssuedDate(null);
        setTpiPoNumber('');
        setFatInspectionDate(null);
        setTpiDraftReportReceivedDate(null);
        setTpiReportApprovedDate(null);
        setMfgstart(null);
        setBldate(null);
        setFatdate(null);
        setFatreportdate(null);
        setVesselreacheddate(null);
        setCustomscleareddate(null);
        setShipmentbookeddate(null);
        setGrossweight('');
        setSaberapplieddate(null);
        setSaberreceiveddate(null);
        setFfnoMinateddate(null);
        setFinalremarks('');
        await loadMilestoneActuals();
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch schedule data');
      }

      // Only set the data if we have a valid response
      if (data) {
        // Set general data
        if (data.generaldata) {
          setPOackdate(data.generaldata.poackdate ? parseISO(data.generaldata.poackdate) : null);
          setPodelydate(data.generaldata.podelydate ? parseISO(data.generaldata.podelydate) : null);
          setEstdelydate(data.generaldata.estdelydate ? parseISO(data.generaldata.estdelydate) : null);
          setDelysch(data.generaldata.delysch || '');
          setBasedesignrecdate(data.generaldata.basedesignrecdate ? parseISO(data.generaldata.basedesignrecdate) : null);
          setBasedesignapprdate(data.generaldata.basedesignapprdate ? parseISO(data.generaldata.basedesignapprdate) : null);
          setBasedesigncomments(data.generaldata.basedesigncomments || '');
          setGeneralcomments(data.generaldata.generalcomments || '');
          setDetdesignrecdate(data.generaldata.detdesignrecdate ? parseISO(data.generaldata.detdesignrecdate) : null);
          setDetdesignaprdate(data.generaldata.detdesignaprdate ? parseISO(data.generaldata.detdesignaprdate) : null);
          setMfgclearancedate(data.generaldata.mfgclearancedate ? parseISO(data.generaldata.mfgclearancedate) : null);
          setItpapprdate(data.generaldata.itpapprdate ? parseISO(data.generaldata.itpapprdate) : null);
          setFinalworkcompleteddate(data.generaldata.finalworkcompleteddate ? parseISO(data.generaldata.finalworkcompleteddate) : null);
          setGrdate(data.generaldata.grdate ? parseISO(data.generaldata.grdate) : null);
        }

        // Set payment data
        if (data.paymentdata) {
          // Handle old paymentdata structure (flat object) and convert to new structure
          if (data.paymentdata.advpaiddate || data.paymentdata.advamountpaid || 
              data.paymentdata.milestoneamountpaiddate || data.paymentdata.milestoneamountpaid ||
              data.paymentdata.finalpaiddate || data.paymentdata.finalpaidamt) {
            
            // Convert old structure to new structure for frontend
            const newAdvancePayments = [];
            const newMilestonePayments = [];
            let newFinalPayment = { requesteddate: null, date: null, amount: '', comments: '' };

            // Convert advance payment data
            if (data.paymentdata.advpaiddate || data.paymentdata.advamountpaid) {
              newAdvancePayments.push({
                requesteddate: null,
                date: data.paymentdata.advpaiddate ? parseISO(data.paymentdata.advpaiddate) : null,
                amount: data.paymentdata.advamountpaid || '',
                remarks: data.paymentdata.advremarks || '',
                id: 1
              });
            }

            // Convert milestone payment data
            if (data.paymentdata.milestoneamountpaiddate || data.paymentdata.milestoneamountpaid) {
              newMilestonePayments.push({
                requesteddate: null,
                date: data.paymentdata.milestoneamountpaiddate ? parseISO(data.paymentdata.milestoneamountpaiddate) : null,
                amount: data.paymentdata.milestoneamountpaid || '',
                remarks: data.paymentdata.milestoneremarks || '',
                id: 1
              });
            }

            // Convert final payment data
            if (data.paymentdata.finalpaiddate || data.paymentdata.finalpaidamt || data.paymentdata.finalcomments) {
              newFinalPayment = {
                requesteddate: null,
                date: data.paymentdata.finalpaiddate ? parseISO(data.paymentdata.finalpaiddate) : null,
                amount: data.paymentdata.finalpaidamt || '',
                comments: data.paymentdata.finalcomments || ''
              };
            }

            setAdvancePayments(newAdvancePayments);
            setMilestonePayments(newMilestonePayments);
            setFinalPayment(newFinalPayment);
          } else {
            // Handle new paymentdata structure (arrays and objects)
            // Handle advance payments
            const parsedAdvancePayments = (data.paymentdata.advancePayments || []).map((payment, index) => ({
              ...payment,
              requesteddate: payment.requesteddate ? parseISO(payment.requesteddate) : null,
              date: payment.date ? parseISO(payment.date) : null,
              remarks: payment.remarks || '',
              id: payment.id || index + 1
            }));
            setAdvancePayments(parsedAdvancePayments);

            // Handle milestone payments
            const parsedMilestonePayments = (data.paymentdata.milestonePayments || []).map((payment, index) => ({
              ...payment,
              requesteddate: payment.requesteddate ? parseISO(payment.requesteddate) : null,
              date: payment.date ? parseISO(payment.date) : null,
              remarks: payment.remarks || '',
              id: payment.id || index + 1
            }));
            setMilestonePayments(parsedMilestonePayments);

            // Handle final payment
            const finalPayment = data.paymentdata.finalPayment || { requesteddate: null, date: null, amount: '', comments: '' };
            setFinalPayment({
              ...finalPayment,
              requesteddate: finalPayment.requesteddate ? parseISO(finalPayment.requesteddate) : null,
              date: finalPayment.date ? parseISO(finalPayment.date) : null
            });
          }
        }

        // Set BG data
        if (data.bgdata) {
          setAbgestdate(data.bgdata.abgestdate ? parseISO(data.bgdata.abgestdate) : null);
          setAbgactualdate(data.bgdata.abgactualdate ? parseISO(data.bgdata.abgactualdate) : null);
          setAbgexpirydate(data.bgdata.abgexpirydate ? parseISO(data.bgdata.abgexpirydate) : null);
          setAbgamount(data.bgdata.abgamount || 0);
          setPbgestdate(data.bgdata.pbgestdate ? parseISO(data.bgdata.pbgestdate) : null);
          setPbgactualdate(data.bgdata.pbgactualdate ? parseISO(data.bgdata.pbgactualdate) : null);
          setPbgreturneddate(data.bgdata.pbgreturneddate ? parseISO(data.bgdata.pbgreturneddate) : null);
          setAbgreturneddate(data.bgdata.abgreturneddate ? parseISO(data.bgdata.abgreturneddate) : null);
          setPbgamount(data.bgdata.pbgamount || 0);
          setBgremarks(data.bgdata.bgremarks || '');
          setPbgexpirydate(data.bgdata.pbgexpirydate ? parseISO(data.bgdata.pbgexpirydate) : null);
        }

        // Set LC data
        if (data.lcdata) {
          setLcEstopendate(data.lcdata.lcestopendate ? parseISO(data.lcdata.lcestopendate) : null);
          setLcOpeneddate(data.lcdata.lcopeneddate ? parseISO(data.lcdata.lcopeneddate) : null);
          setLcDatadate(data.lcdata.lcdatadate ? parseISO(data.lcdata.lcdatadate) : null);
          setLcLastshipdate(data.lcdata.lclastshipdate ? parseISO(data.lcdata.lclastshipdate) : null);
          setLcExpirydate(data.lcdata.lcexpirydate ? parseISO(data.lcdata.lcexpirydate) : null);
          setLcincoterm(data.lcdata.lcincoterm || '');
          setLcdocuments(data.lcdata.lcdocuments || '');
          setLcamount(data.lcdata.lcamount || 0);
          setLcremarks(data.lcdata.lcremarks || '');
          setLcswift(data.lcdata.lcswift || '');
        }

        if (data.inspectiondata) {
          setItpSubmittedDate(data.inspectiondata.itpSubmittedDate ? parseISO(data.inspectiondata.itpSubmittedDate) : null);
          setItpApprovedDate(data.inspectiondata.itpApprovedDate ? parseISO(data.inspectiondata.itpApprovedDate) : null);
          setTpiRequestedDate(data.inspectiondata.tpiRequestedDate ? parseISO(data.inspectiondata.tpiRequestedDate) : null);
          setTpiPoIssuedDate(data.inspectiondata.tpiPoIssuedDate ? parseISO(data.inspectiondata.tpiPoIssuedDate) : null);
          setTpiPoNumber(data.inspectiondata.tpiPoNumber || '');
          setFatInspectionDate(data.inspectiondata.fatInspectionDate ? parseISO(data.inspectiondata.fatInspectionDate) : null);
          setTpiDraftReportReceivedDate(data.inspectiondata.tpiDraftReportReceivedDate ? parseISO(data.inspectiondata.tpiDraftReportReceivedDate) : null);
          setTpiReportApprovedDate(data.inspectiondata.tpiReportApprovedDate ? parseISO(data.inspectiondata.tpiReportApprovedDate) : null);
        } else {
          setItpSubmittedDate(null);
          setItpApprovedDate(null);
          setTpiRequestedDate(null);
          setTpiPoIssuedDate(null);
          setTpiPoNumber('');
          setFatInspectionDate(null);
          setTpiDraftReportReceivedDate(null);
          setTpiReportApprovedDate(null);
        }

        // Set progress data
        if (data.progressdata) {
          setMfgstart(data.progressdata.mfgstart ? parseISO(data.progressdata.mfgstart) : null);
          setBldate(data.progressdata.Bldate ? parseISO(data.progressdata.Bldate) : null);
          setFatdate(data.progressdata.Fatdate ? parseISO(data.progressdata.Fatdate) : null);
          setFatreportdate(data.progressdata.Fatreportdate ? parseISO(data.progressdata.Fatreportdate) : null);
          setVesselreacheddate(data.progressdata.vesselreacheddate ? parseISO(data.progressdata.vesselreacheddate) : null);
          setCustomscleareddate(data.progressdata.customscleareddate ? parseISO(data.progressdata.customscleareddate) : null);
        }

        // Set ship data
        if (data.shipdata) {
          setShipmentbookeddate(data.shipdata.shipmentbookeddate ? parseISO(data.shipdata.shipmentbookeddate) : null);
          setGrossweight(data.shipdata.grossweight || '');
          setSaberapplieddate(data.shipdata.saberapplieddate ? parseISO(data.shipdata.saberapplieddate) : null);
          setSaberreceiveddate(data.shipdata.saberreceiveddate ? parseISO(data.shipdata.saberreceiveddate) : null);
          setFfnoMinateddate(data.shipdata.ffnoMinateddate ? parseISO(data.shipdata.ffnoMinateddate) : null);
          setFinalremarks(data.shipdata.finalremarks || '');
        }
      }
      await loadMilestoneActuals();
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast.error('Failed to fetch schedule data');
      await loadMilestoneActuals();
    }
  };

  // Handle view PO click
  const handleViewPO = (ponumber) => {
    router.push(`/openpurchaseorders/view-po?ponumber=${ponumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by PO number, vendor name, or vendor code..."
                className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-md">
              <span className="text-gray-600 font-medium">
                {sortedAndFilteredData.length} Open PO{sortedAndFilteredData.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Open Purchase Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('po-number')}
                    >
                      PO Number <SortIndicator columnKey="po-number" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('po-date')}
                    >
                      PO Date <SortIndicator columnKey="po-date" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('delivery-date')}
                    >
                      Delivery Date <SortIndicator columnKey="delivery-date" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('plant')}
                    >
                      Plant <SortIndicator columnKey="plant" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('vendorcode')}
                    >
                      Vendor Code <SortIndicator columnKey="vendorcode" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('vendorname')}
                    >
                      Vendor Name <SortIndicator columnKey="vendorname" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('povalue')}
                    >
                      PO Value <SortIndicator columnKey="povalue" />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('openvalue')}
                    >
                      Open Value <SortIndicator columnKey="openvalue" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredData.map((po, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po._id["po-number"]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po["po-date"] ? moment(po["po-date"]).format('MM/DD/YYYY') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po["delivery-date"] ? moment(po["delivery-date"]).format('MM/DD/YYYY') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po._id.plant}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po._id.vendorcode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {po._id.vendorname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.povalue ? po.povalue.toLocaleString() : '0'} SAR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.openvalue.toLocaleString()} SAR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleScheduleClick(po)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FiCalendar className="mr-1" />
                            Schedule
                          </button>
                          <button
                            onClick={() => handleCommentClick(po._id["po-number"])}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FiMessageSquare className="mr-1" />
                            Comments
                          </button>
                          <button
                            onClick={() => handleViewPO(po._id["po-number"])}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            <FiEye className="mr-1" />
                            View PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 transform transition-all max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Comments for PO: {selectedPO}</h2>
                  <button
                    onClick={() => setShowCommentModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - Horizontal Split */}
              <div className="flex-1 flex overflow-hidden p-6 gap-4">
                {/* Left Side - Add Comment Form */}
                <div className="w-1/2 flex flex-col border-r border-gray-200 pr-4">
                  <form onSubmit={handleCommentSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="mb-4 flex-shrink-0">
                      <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 mb-4">
                      <div className="flex-1 quill-editor-wrapper" style={{ maxHeight: 'calc(90vh - 280px)', minHeight: '300px' }}>
                        <ReactQuill
                          value={comment}
                          onChange={setComment}
                          className="w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 h-full"
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'underline'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['clean']
                            ]
                          }}
                          style={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        />
                      </div>
                      <style dangerouslySetInnerHTML={{__html: `
                        .quill-editor-wrapper .ql-container {
                          flex: 1;
                          display: flex;
                          flex-direction: column;
                          overflow: hidden;
                          height: calc(100% - 42px);
                        }
                        .quill-editor-wrapper .ql-editor {
                          flex: 1;
                          overflow-y: auto;
                          min-height: 200px;
                        }
                      `}} />
                    </div>
                    <div className="flex justify-end space-x-3 flex-shrink-0 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowCommentModal(false)}
                        className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Add Comment
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Side - Previous Comments */}
                <div className="w-1/2 pl-4 overflow-y-auto">
                  <div className="space-y-4 pr-2">
                    {comments.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No comments yet. Add your first comment on the left.</div>
                    ) : (
                      comments.map((comment, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-400">{comment.title}</span>
                            <span className="text-[10px] italic text-gray-500">
                              {moment.utc(comment.updatedAt).local().format('MMM D, YYYY h:mm A')}
                            </span>
                          </div>
                          <div className="text-gray-900 italilc text-xs" dangerouslySetInnerHTML={{ __html: comment.comment }} />
                          <div className="mt-2 text-xs text-gray-500">
                            By: {comment.updatedBy}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 transform transition-all max-h-[90vh] flex flex-col">
              <style dangerouslySetInnerHTML={{__html: `
                .react-datepicker__input-container input[class*="text-red-600"] {
                  color: rgb(220 38 38) !important;
                  font-weight: 600 !important;
                }
              `}} />
              {/* Modal Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Schedule for PO: {selectedPO}</h2>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('general')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'general'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      General
                    </button>
                    <button
                      onClick={() => setActiveTab('payment')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'payment'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Payment Schedule
                    </button>
                    <button
                      onClick={() => setActiveTab('bank')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'bank'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Bank Guarantee
                    </button>
                    <button
                      onClick={() => setActiveTab('lc')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'lc'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      LC
                    </button>
                    <button
                      onClick={() => setActiveTab('inspection')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'inspection'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Inspection
                    </button>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'progress'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => setActiveTab('shipping')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'shipping'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Shipping
                    </button>
                    {isScheduleMilestonesEligible(selectedSchedulePo) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('milestones')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'milestones'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-red-600 hover:text-red-700 hover:border-red-300'
                        }`}
                      >
                        Scheduled dates
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'general' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Acknowledgment Date</label>
                        <DatePicker
                          selected={poackdate}
                          onChange={date => setPOackdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${poackdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Delivery Date</label>
                        <DatePicker
                          selected={podelydate}
                          onChange={date => setPodelydate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${podelydate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                        <DatePicker
                          selected={estdelydate}
                          onChange={date => setEstdelydate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${estdelydate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Schedule</label>
                        <input
                          type="text"
                          value={delysch}
                          onChange={(e) => setDelysch(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${delysch ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter delivery schedule"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Design Received Date</label>
                        <DatePicker
                          selected={basedesignrecdate}
                          onChange={date => setBasedesignrecdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${basedesignrecdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Design Approval Date</label>
                        <DatePicker
                          selected={basedesignapprdate}
                          onChange={date => setBasedesignapprdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${basedesignapprdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Design Received Date</label>
                        <DatePicker
                          selected={detdesignrecdate}
                          onChange={date => setDetdesignrecdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${detdesignrecdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Design Approval Date</label>
                        <DatePicker
                          selected={detdesignaprdate}
                          onChange={date => setDetdesignaprdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${detdesignaprdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Clearance Date</label>
                        <DatePicker
                          selected={mfgclearancedate}
                          onChange={date => setMfgclearancedate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${mfgclearancedate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ITP Approval Date</label>
                        <DatePicker
                          selected={itpapprdate}
                          onChange={date => setItpapprdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${itpapprdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Work Completed Date</label>
                        <DatePicker
                          selected={finalworkcompleteddate}
                          onChange={date => setFinalworkcompleteddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${finalworkcompleteddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GR Date</label>
                        <DatePicker
                          selected={grdate}
                          onChange={date => setGrdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${grdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Design Comments</label>
                        <textarea
                          value={basedesigncomments}
                          onChange={(e) => setBasedesigncomments(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${basedesigncomments ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter base design comments"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">General Comments</label>
                        <textarea
                          value={generalcomments}
                          onChange={(e) => setGeneralcomments(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${generalcomments ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter general comments"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'payment' && (
                    <div className="grid grid-cols-3 gap-4">
                      {/* Advance Payments */}
                      <div className="col-span-3">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Advance Payments</h3>
                          <button
                            onClick={addAdvancePayment}
                            className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                          >
                            Add Payment
                          </button>
                        </div>
                        {advancePayments.map((payment, index) => (
                          <div key={payment.id} className="grid grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                              <DatePicker
                                selected={payment.requesteddate}
                                onChange={date => updateAdvancePayment(payment.id, 'requesteddate', date)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.requesteddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="Select date"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                              <DatePicker
                                selected={payment.date}
                                onChange={date => updateAdvancePayment(payment.id, 'date', date)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.date ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="Select date"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                              <input
                                type="text"
                                value={payment.amount}
                                onChange={(e) => updateAdvancePayment(payment.id, 'amount', e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.amount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                              <input
                                type="text"
                                value={payment.remarks || ""}
                                onChange={(e) => updateAdvancePayment(payment.id, 'remarks', e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.remarks ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                placeholder="Enter remarks"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => removeAdvancePayment(payment.id)}
                                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Milestone Payments */}
                      <div className="col-span-3">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Milestone Payments</h3>
                          <button
                            onClick={addMilestonePayment}
                            className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                          >
                            Add Payment
                          </button>
                        </div>
                        {milestonePayments.map((payment, index) => (
                          <div key={payment.id} className="grid grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                              <DatePicker
                                selected={payment.requesteddate}
                                onChange={date => updateMilestonePayment(payment.id, 'requesteddate', date)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.requesteddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="Select date"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                              <DatePicker
                                selected={payment.date}
                                onChange={date => updateMilestonePayment(payment.id, 'date', date)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.date ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="Select date"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                              <input
                                type="text"
                                value={payment.amount}
                                onChange={(e) => updateMilestonePayment(payment.id, 'amount', e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.amount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                              <input
                                type="text"
                                value={payment.remarks || ""}
                                onChange={(e) => updateMilestonePayment(payment.id, 'remarks', e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${payment.remarks ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                                placeholder="Enter remarks"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => removeMilestonePayment(payment.id)}
                                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Final Payment */}
                      <div className="col-span-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Final Payment</h3>
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                            <DatePicker
                              selected={finalPayment.requesteddate}
                              onChange={date => setFinalPayment({ ...finalPayment, requesteddate: date })}
                              className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${finalPayment.requesteddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                              dateFormat="MM/dd/yyyy"
                              placeholderText="Select date"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                            <DatePicker
                              selected={finalPayment.date}
                              onChange={date => setFinalPayment({ ...finalPayment, date })}
                              className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${finalPayment.date ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                              dateFormat="MM/dd/yyyy"
                              placeholderText="Select date"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                              type="text"
                              value={finalPayment.amount}
                              onChange={(e) => setFinalPayment({ ...finalPayment, amount: e.target.value })}
                              className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${finalPayment.amount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                            <textarea
                              value={finalPayment.comments}
                              onChange={(e) => setFinalPayment({ ...finalPayment, comments: e.target.value })}
                              className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${finalPayment.comments ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                              placeholder="Enter comments"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'bank' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ABG Expected Date</label>
                        <DatePicker
                          selected={abgestdate}
                          onChange={date => setAbgestdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${abgestdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ABG Actual Date</label>
                        <DatePicker
                          selected={abgactualdate}
                          onChange={date => setAbgactualdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${abgactualdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ABG Expiry Date</label>
                        <DatePicker
                          selected={abgexpirydate}
                          onChange={date => setAbgexpirydate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${abgexpirydate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ABG Amount</label>
                        <input
                          type="number"
                          value={abgamount}
                          onChange={(e) => setAbgamount(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${abgamount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PBG Expected Date</label>
                        <DatePicker
                          selected={pbgestdate}
                          onChange={date => setPbgestdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${pbgestdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PBG Actual Date</label>
                        <DatePicker
                          selected={pbgactualdate}
                          onChange={date => setPbgactualdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${pbgactualdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PBG Returned Date</label>
                        <DatePicker
                          selected={pbgreturneddate}
                          onChange={date => setPbgreturneddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${pbgreturneddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ABG Returned Date</label>
                        <DatePicker
                          selected={abgreturneddate}
                          onChange={date => setAbgreturneddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${abgreturneddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PBG Amount</label>
                        <input
                          type="number"
                          value={pbgamount}
                          onChange={(e) => setPbgamount(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${pbgamount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PBG Expiry Date</label>
                        <DatePicker
                          selected={pbgexpirydate}
                          onChange={date => setPbgexpirydate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${pbgexpirydate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">BG Remarks</label>
                        <textarea
                          value={bgremarks}
                          onChange={(e) => setBgremarks(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${bgremarks ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'lc' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Expected Open Date</label>
                        <DatePicker
                          selected={lcestopendate}
                          onChange={date => setLcEstopendate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcestopendate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Opened Date</label>
                        <DatePicker
                          selected={lcopeneddate}
                          onChange={date => setLcOpeneddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcopeneddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Data Date</label>
                        <DatePicker
                          selected={lcdatadate}
                          onChange={date => setLcDatadate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcdatadate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Last Ship Date</label>
                        <DatePicker
                          selected={lclastshipdate}
                          onChange={date => setLcLastshipdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lclastshipdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Expiry Date</label>
                        <DatePicker
                          selected={lcexpirydate}
                          onChange={date => setLcExpirydate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcexpirydate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Incoterm</label>
                        <input
                          type="text"
                          value={lcincoterm}
                          onChange={(e) => setLcincoterm(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcincoterm ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter incoterm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Documents</label>
                        <input
                          type="text"
                          value={lcdocuments}
                          onChange={(e) => setLcdocuments(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcdocuments ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter documents"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Amount</label>
                        <input
                          type="number"
                          value={lcamount}
                          onChange={(e) => setLcamount(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcamount ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Swift</label>
                        <input
                          type="text"
                          value={lcswift}
                          onChange={(e) => setLcswift(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${lcswift ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter swift"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">LC Remarks</label>
                        <textarea
                          value={lcremarks}
                          onChange={(e) => setLcremarks(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${lcremarks ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'inspection' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ITP submitted date</label>
                        <DatePicker
                          selected={itpSubmittedDate}
                          onChange={date => setItpSubmittedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${itpSubmittedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ITP approved date</label>
                        <DatePicker
                          selected={itpApprovedDate}
                          onChange={date => setItpApprovedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${itpApprovedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TPI requested date</label>
                        <DatePicker
                          selected={tpiRequestedDate}
                          onChange={date => setTpiRequestedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tpiRequestedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TPI PO issued date</label>
                        <DatePicker
                          selected={tpiPoIssuedDate}
                          onChange={date => setTpiPoIssuedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tpiPoIssuedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TPI PO number</label>
                        <input
                          type="text"
                          value={tpiPoNumber}
                          onChange={(e) => setTpiPoNumber(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tpiPoNumber ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter TPI PO number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FAT / inspection date</label>
                        <DatePicker
                          selected={fatInspectionDate}
                          onChange={date => setFatInspectionDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${fatInspectionDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TPI draft report received date</label>
                        <DatePicker
                          selected={tpiDraftReportReceivedDate}
                          onChange={date => setTpiDraftReportReceivedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tpiDraftReportReceivedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TPI report approved date</label>
                        <DatePicker
                          selected={tpiReportApprovedDate}
                          onChange={date => setTpiReportApprovedDate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${tpiReportApprovedDate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'progress' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Start Date</label>
                        <DatePicker
                          selected={mfgstart}
                          onChange={date => setMfgstart(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${mfgstart ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BL Date</label>
                        <DatePicker
                          selected={Bldate}
                          onChange={date => setBldate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${Bldate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FAT Date</label>
                        <DatePicker
                          selected={Fatdate}
                          onChange={date => setFatdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${Fatdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FAT Report Date</label>
                        <DatePicker
                          selected={Fatreportdate}
                          onChange={date => setFatreportdate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${Fatreportdate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Reached Date</label>
                        <DatePicker
                          selected={vesselreacheddate}
                          onChange={date => setVesselreacheddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${vesselreacheddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customs Cleared Date</label>
                        <DatePicker
                          selected={customscleareddate}
                          onChange={date => setCustomscleareddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${customscleareddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Booked Date</label>
                        <DatePicker
                          selected={shipmentbookeddate}
                          onChange={date => setShipmentbookeddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${shipmentbookeddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
                        <input
                          type="text"
                          value={grossweight}
                          onChange={(e) => setGrossweight(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${grossweight ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter weight"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SABER Applied Date</label>
                        <DatePicker
                          selected={saberapplieddate}
                          onChange={date => setSaberapplieddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${saberapplieddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SABER Received Date</label>
                        <DatePicker
                          selected={saberreceiveddate}
                          onChange={date => setSaberreceiveddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${saberreceiveddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">FF Nominated Date</label>
                        <DatePicker
                          selected={ffnoMinateddate}
                          onChange={date => setFfnoMinateddate(date)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${ffnoMinateddate ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Select date"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Remarks</label>
                        <textarea
                          value={finalremarks}
                          onChange={(e) => setFinalremarks(e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[80px] resize-y ${finalremarks ? 'bg-red-50 text-red-600 font-semibold' : 'bg-white text-gray-700'}`}
                          placeholder="Enter remarks"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'milestones' && isScheduleMilestonesEligible(selectedSchedulePo) && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Open POs over 100,000 SAR: scheduled dates are calendar dates (PO issue date + offset). Use{' '}
                        <span className="font-medium text-red-600">Save Schedule</span> below to store actual dates.
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {PO_MILESTONE_ROWS.map((row) => {
                          const poDateRaw = selectedSchedulePo['po-date'];
                          const scheduledDisplay =
                            poDateRaw != null && poDateRaw !== ''
                              ? moment(poDateRaw).clone().add(row.daysFromPo, 'days').format('MM/DD/YYYY')
                              : 'N/A';
                          return (
                            <div
                              key={row.key}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{row.label}</label>
                                <p className="text-xs text-gray-500">+{row.daysFromPo} days from PO issue</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled date</label>
                                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-800">
                                  {scheduledDisplay}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual date</label>
                                <DatePicker
                                  selected={milestoneActuals[row.key]}
                                  onChange={(date) =>
                                    setMilestoneActuals((prev) => ({ ...prev, [row.key]: date }))
                                  }
                                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ${
                                    milestoneActuals[row.key]
                                      ? 'bg-red-50 text-red-600 font-semibold'
                                      : 'bg-white text-gray-700'
                                  }`}
                                  dateFormat="MM/dd/yyyy"
                                  placeholderText="Select date"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleScheduleSubmit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Save Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" />
        
        {/* Spacer to push footer down - ensures footer stays at bottom */}
        <div className="flex-1 min-h-[200px]"></div>
        
        {/* Footer with proper spacing */}
        <div className="mt-24 relative w-full">
        </div>
      </main>
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

export default Openpurchaseorders1; 