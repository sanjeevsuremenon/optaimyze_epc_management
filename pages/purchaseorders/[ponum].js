import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faDollarSign, faShip } from "@fortawesome/free-solid-svg-icons";

function PurchaseOrderDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const { ponum } = router.query;
  
  // State for all data
  const [poLineItems, setPOLineItems] = useState([]);
  const [poSchedule, setPOSchedule] = useState(null);
  const [poComments, setPOComments] = useState([]);
  const [poLogs, setPOLogs] = useState([]);
  const [poFeedback, setPOFeedback] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [basicInfo, setBasicInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state for PO Schedule section
  const [scheduleTab, setScheduleTab] = useState('general');

  useEffect(() => {
    if (!ponum) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [
          poResponse,
          scheduleResponse,
          commentsResponse,
          logsResponse,
          feedbackResponse,
          deliveryResponse
        ] = await Promise.all([
          fetch(`/api/purchaseorders/porder/${ponum}`),
          fetch(`/api/purchaseorders/schedule/generaldata/${ponum}`),
          fetch(`/api/purchaseorders/openpo/comments/${ponum}`),
          fetch(`/api/logs/po/by-ponumber/${ponum}`),
          fetch(`/api/po-feedback/by-ponumber/${ponum}`),
          fetch(`/api/materialdocumentsforpo/${ponum}`)
        ]);

        // Process PO line items
        if (poResponse.ok) {
          const poData = await poResponse.json();
          if (poData && poData.length > 0) {
            setPOLineItems(poData);
            const firstRecord = poData[0];
            setBasicInfo({
              ponumber: firstRecord["po-number"] || ponum,
              podate: firstRecord["po-date"],
              "delivery-date": firstRecord["delivery-date"],
              vendorcode: firstRecord.vendorcode || firstRecord["vendor-code"] || "",
              vendorname: firstRecord.vendorname || firstRecord["vendor-name"] || "",
              plant: firstRecord["plant-code"] || "",
              currency: firstRecord.currency || ""
            });
          }
        }

        // Process PO Schedule
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setPOSchedule(scheduleData);
        } else if (scheduleResponse.status === 404) {
          setPOSchedule(null);
        }

        // Process PO Comments
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setPOComments(commentsData || []);
        }

        // Process PO Logs
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setPOLogs(logsData || []);
        }

        // Process PO Feedback
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setPOFeedback(feedbackData || []);
        }

        // Process Delivery History
        if (deliveryResponse.ok) {
          const deliveryData = await deliveryResponse.json();
          setDeliveryHistory(deliveryData || []);
        }

      } catch (error) {
        console.error('Error fetching PO details:', error);
      }
      setLoading(false);
    };

    fetchAllData();
  }, [ponum]);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('MM/DD/YYYY');
  };

  // Format currency helper
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  // Calculate timeline range and events
  const calculateTimeline = () => {
    if (!basicInfo) return { startDate: null, endDate: null, events: [] };

    const events = [];
    const now = moment();
    
    // Add PO Date
    if (basicInfo.podate) {
      events.push({
        date: moment(basicInfo.podate),
        label: 'PO Date',
        type: 'po-date',
        color: 'blue'
      });
    }

    // Add PO Delivery Date
    if (basicInfo["delivery-date"]) {
      events.push({
        date: moment(basicInfo["delivery-date"]),
        label: 'Planned Delivery',
        type: 'planned-delivery',
        color: 'green'
      });
    }

    // Add design-related dates from generaldata
    if (poSchedule && poSchedule.generaldata) {
      const designKeywords = ['design', 'drawing', 'approval', 'review', 'submission'];
      Object.entries(poSchedule.generaldata).forEach(([key, value]) => {
        const keyLower = key.toLowerCase();
        const isDesignRelated = designKeywords.some(keyword => keyLower.includes(keyword));
        
        if (isDesignRelated && value) {
          let dateValue = null;
          if (value instanceof Date) {
            dateValue = moment(value);
          } else if (typeof value === 'string' && moment(value).isValid()) {
            dateValue = moment(value);
          }
          
          if (dateValue && dateValue.isValid()) {
            const label = key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
            events.push({
              date: dateValue,
              label: label,
              type: 'design',
              color: 'purple',
              icon: 'gear',
              milestone: label
            });
          }
        }
      });
    }

    // Add payment dates from paymentdata
    if (poSchedule && poSchedule.paymentdata) {
      // Advance payments
      if (poSchedule.paymentdata.advancePayments && Array.isArray(poSchedule.paymentdata.advancePayments)) {
        poSchedule.paymentdata.advancePayments.forEach((payment, idx) => {
          if (payment && payment.date) {
            let dateValue = null;
            if (payment.date instanceof Date) {
              dateValue = moment(payment.date);
            } else if (typeof payment.date === 'string' && moment(payment.date).isValid()) {
              dateValue = moment(payment.date);
            }
            
            if (dateValue && dateValue.isValid()) {
              const amount = payment.amount ? formatCurrency(payment.amount) : '';
              events.push({
                date: dateValue,
                label: `Advance Payment ${idx + 1}${amount ? ': ' + amount : ''}`,
                type: 'payment',
                color: 'green',
                icon: 'dollar',
                milestone: `Advance Payment ${idx + 1}`
              });
            }
          }
        });
      }

      // Milestone payments
      if (poSchedule.paymentdata.milestonePayments && Array.isArray(poSchedule.paymentdata.milestonePayments)) {
        poSchedule.paymentdata.milestonePayments.forEach((payment, idx) => {
          if (payment && payment.date) {
            let dateValue = null;
            if (payment.date instanceof Date) {
              dateValue = moment(payment.date);
            } else if (typeof payment.date === 'string' && moment(payment.date).isValid()) {
              dateValue = moment(payment.date);
            }
            
            if (dateValue && dateValue.isValid()) {
              const amount = payment.amount ? formatCurrency(payment.amount) : '';
              events.push({
                date: dateValue,
                label: `Milestone Payment ${idx + 1}${amount ? ': ' + amount : ''}`,
                type: 'payment',
                color: 'green',
                icon: 'dollar',
                milestone: `Milestone Payment ${idx + 1}`
              });
            }
          }
        });
      }

      // Final payment
      if (poSchedule.paymentdata.finalPayment && poSchedule.paymentdata.finalPayment.date) {
        let dateValue = null;
        if (poSchedule.paymentdata.finalPayment.date instanceof Date) {
          dateValue = moment(poSchedule.paymentdata.finalPayment.date);
        } else if (typeof poSchedule.paymentdata.finalPayment.date === 'string' && moment(poSchedule.paymentdata.finalPayment.date).isValid()) {
          dateValue = moment(poSchedule.paymentdata.finalPayment.date);
        }
        
        if (dateValue && dateValue.isValid()) {
          const amount = poSchedule.paymentdata.finalPayment.amount ? formatCurrency(poSchedule.paymentdata.finalPayment.amount) : '';
          events.push({
            date: dateValue,
            label: `Final Payment${amount ? ': ' + amount : ''}`,
            type: 'payment',
            color: 'green',
            icon: 'dollar',
            milestone: 'Final Payment'
          });
        }
      }
    }

    // Add LC dates from lcdata
    if (poSchedule && poSchedule.lcdata) {
      const lcDateFields = ['lcexpdate', 'lcopendate', 'lcissuedate', 'lcexpirydate', 'lcreceiveddate'];
      Object.entries(poSchedule.lcdata).forEach(([key, value]) => {
        const keyLower = key.toLowerCase();
        const isLcDate = lcDateFields.some(field => keyLower.includes(field)) || 
                        (keyLower.includes('lc') && (keyLower.includes('date') || keyLower.includes('exp')));
        
        if (isLcDate && value) {
          let dateValue = null;
          if (value instanceof Date) {
            dateValue = moment(value);
          } else if (typeof value === 'string' && moment(value).isValid()) {
            dateValue = moment(value);
          }
          
          if (dateValue && dateValue.isValid()) {
            const label = key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
            events.push({
              date: dateValue,
              label: label,
              type: 'lc',
              color: 'teal',
              icon: 'ship',
              milestone: label
            });
          }
        }
      });
    }

    // Add actual delivery dates from delivery history
    if (deliveryHistory && deliveryHistory.length > 0) {
      const deliveryDates = deliveryHistory
        .map(d => d.documentdate ? moment(d.documentdate) : null)
        .filter(d => d !== null)
        .sort((a, b) => a.valueOf() - b.valueOf());
      
      // Get unique dates
      const uniqueDates = [...new Set(deliveryDates.map(d => d.format('YYYY-MM-DD')))];
      
      uniqueDates.forEach(dateStr => {
        const date = moment(dateStr);
        const deliveries = deliveryHistory.filter(d => 
          d.documentdate && moment(d.documentdate).format('YYYY-MM-DD') === dateStr
        );
        const totalQty = deliveries.reduce((sum, d) => {
          const qty = d.documentqty?.$numberDecimal 
            ? parseFloat(d.documentqty.$numberDecimal) 
            : (typeof d.documentqty === 'number' ? d.documentqty : 0);
          return sum + qty;
        }, 0);
        
        events.push({
          date: date,
          label: `Delivery: ${totalQty.toLocaleString()}`,
          type: 'actual-delivery',
          color: 'orange',
          count: deliveries.length
        });
      });
    }

    // Calculate start date (month of PO date)
    const startDate = basicInfo.podate 
      ? moment(basicInfo.podate).startOf('month')
      : moment().startOf('month');

    // Calculate end date
    let endDate;
    
    // Get last actual delivery date
    const actualDeliveryDates = events
      .filter(e => e.type === 'actual-delivery')
      .map(e => e.date)
      .sort((a, b) => b.valueOf() - a.valueOf());
    
    const lastDeliveryDate = actualDeliveryDates.length > 0 ? actualDeliveryDates[0] : null;
    
    // Check if PO is fully delivered (compare total delivered vs total ordered)
    const totalOrdered = poLineItems.reduce((sum, item) => {
      const qty = item["po-quantity"]?.$numberDecimal 
        ? parseFloat(item["po-quantity"].$numberDecimal) 
        : (typeof item["po-quantity"] === 'number' ? item["po-quantity"] : 0);
      return sum + qty;
    }, 0);
    
    const totalDelivered = deliveryHistory.reduce((sum, d) => {
      const qty = d.documentqty?.$numberDecimal 
        ? parseFloat(d.documentqty.$numberDecimal) 
        : (typeof d.documentqty === 'number' ? d.documentqty : 0);
      return sum + qty;
    }, 0);
    
    const isFullyDelivered = totalDelivered >= totalOrdered;
    
    if (isFullyDelivered && lastDeliveryDate) {
      // If fully delivered, end at last delivery month
      endDate = lastDeliveryDate.endOf('month');
    } else {
      // Not fully delivered
      const sixMonthsFuture = now.clone().add(6, 'months').endOf('month');
      const plannedDeliveryEnd = basicInfo["delivery-date"] 
        ? moment(basicInfo["delivery-date"]).endOf('month')
        : null;
      
      if (plannedDeliveryEnd && plannedDeliveryEnd.isAfter(sixMonthsFuture)) {
        // If planned delivery is more than 6 months away, use it
        endDate = plannedDeliveryEnd;
      } else {
        // Otherwise use 6 months from now
        endDate = sixMonthsFuture;
      }
    }

    // Sort events by date
    events.sort((a, b) => a.date.valueOf() - b.date.valueOf());

    return { startDate, endDate, events };
  };

  const timeline = calculateTimeline();

  // compute simple PO totals/status for header badge
  const totals = useMemo(() => {
    const totalOrdered = poLineItems.reduce((sum, item) => {
      const qty = item["po-quantity"]?.$numberDecimal ? parseFloat(item["po-quantity"].$numberDecimal) : (typeof item["po-quantity"] === 'number' ? item["po-quantity"] : 0);
      return sum + (qty || 0);
    }, 0);
    const totalDelivered = deliveryHistory.reduce((sum, d) => {
      const qty = d.documentqty?.$numberDecimal ? parseFloat(d.documentqty.$numberDecimal) : (typeof d.documentqty === 'number' ? d.documentqty : 0);
      return sum + (qty || 0);
    }, 0);
    return { totalOrdered, totalDelivered, isFullyDelivered: totalDelivered >= totalOrdered };
  }, [poLineItems, deliveryHistory]);

  // Render timeline
  const renderTimeline = () => {
    if (!timeline.startDate || !timeline.endDate) return null;

    const start = timeline.startDate;
    const end = timeline.endDate;
    const totalMonths = end.diff(start, 'months') + 1;
    const months = [];
    
    let current = start.clone();
    while (current.isSameOrBefore(end, 'month')) {
      months.push(current.clone());
      current.add(1, 'month');
    }

    // Calculate position for each event
    const getEventPosition = (eventDate) => {
      const monthsDiff = eventDate.diff(start, 'months', true);
      return (monthsDiff / totalMonths) * 100;
    };

    return (
      <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-cyan-600 p-6 text-slate-100">
        <h2 className="text-2xl font-bold text-cyan-300 mb-6">PO Timeline</h2>
        
        {/* Timeline axis */}
        <div className="relative mb-8" style={{ height: '120px' }}>
          {/* Month markers */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800/40 rounded-full"></div>
          
          {months.map((month, idx) => {
            const position = (idx / (months.length - 1)) * 100;
            return (
              <div
                key={month.format('YYYY-MM')}
                className="absolute"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-1 h-4 bg-gray-400"></div>
                <div className="text-xs text-gray-600 mt-1 whitespace-nowrap" style={{ transform: 'translateX(-50%)' }}>
                  {month.format('MMM YY')}
                </div>
              </div>
            );
          })}

          {/* Events */}
          {timeline.events.map((event, idx) => {
            const position = getEventPosition(event.date);
            const colorClasses = {
              blue: 'bg-blue-500 border-blue-600',
              green: 'bg-green-500 border-green-600',
              orange: 'bg-orange-500 border-orange-600',
              red: 'bg-red-500 border-red-600',
              purple: 'bg-purple-500 border-purple-600',
              teal: 'bg-teal-500 border-teal-600'
            };
            
            // Determine icon
            let iconElement = null;
            if (event.icon === 'gear') {
              iconElement = <FontAwesomeIcon icon={faCog} className="text-white text-xs" />;
            } else if (event.icon === 'dollar') {
              iconElement = <FontAwesomeIcon icon={faDollarSign} className="text-white text-xs" />;
            } else if (event.icon === 'ship') {
              iconElement = <FontAwesomeIcon icon={faShip} className="text-white text-xs" />;
            }
            
            return (
              <div
                key={idx}
                className="absolute"
                style={{ left: `${position}%`, transform: 'translateX(-50%)', top: '20px' }}
              >
                <div className={`w-6 h-6 rounded-full border-2 ${colorClasses[event.color] || 'bg-gray-500'} relative group flex items-center justify-center`}>
                  {iconElement}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-100 text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold mb-1">{event.milestone || event.label}</div>
                    <div className="text-slate-300">{event.date.format('MM/DD/YYYY')}</div>
                    {event.label !== event.milestone && (
                      <div className="text-slate-300 mt-1">{event.label}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mt-2 text-center" style={{ width: '80px', marginLeft: '-40px' }}>
                  {event.date.format('MM/DD')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-cyan-600"></div>
            <span className="text-cyan-300">PO Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-600"></div>
            <span className="text-emerald-300">Planned Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500 border-2 border-violet-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faCog} className="text-white text-xs" />
            </div>
            <span className="text-violet-300">Design Related</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faDollarSign} className="text-white text-xs" />
            </div>
            <span className="text-emerald-300">Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-cyan-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faShip} className="text-white text-xs" />
            </div>
            <span className="text-cyan-300">LC Related</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-600"></div>
            <span className="text-orange-300">Actual Delivery</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="rounded-lg shadow-2xl p-6 bg-slate-800/70 border border-slate-700 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-100">Purchase Order Details</h1>
              <p className="text-slate-300 text-lg">PO Number: <span className="font-mono text-cyan-300">{ponum}</span></p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-full font-semibold shadow-md ${totals.isFullyDelivered ? 'bg-gradient-to-r from-emerald-400 to-green-300 text-slate-900' : 'bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-900'}`}>{totals.isFullyDelivered ? 'Complete' : 'Pending'}</span>
            </div>
          </div>

          {/* Timeline Section */}
          {renderTimeline()}

          {/* Top Section: Two Columns - Basic Info (Left) and Line Items (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic Information */}
            {basicInfo && (
              <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-cyan-600" style={{ height: '40vh' }}>
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60">
                  <h2 className="text-2xl font-bold text-cyan-300">Basic Information</h2>
                </div>
                <div className="p-6 overflow-y-auto" style={{ height: 'calc(40vh - 80px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">PO Number</label>
                      <p className="text-xl font-bold text-slate-100">{basicInfo.ponumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">PO Date</label>
                      <p className="text-lg text-slate-100">{formatDate(basicInfo.podate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Delivery Date</label>
                      <p className="text-lg text-slate-100">{formatDate(basicInfo["delivery-date"])}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Plant</label>
                      <p className="text-lg text-slate-100">{basicInfo.plant || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Vendor Code</label>
                      <p className="text-lg text-slate-100">{basicInfo.vendorcode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Vendor Name</label>
                      <p className="text-lg text-slate-100">{basicInfo.vendorname || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Currency</label>
                      <p className="text-lg text-slate-100">{basicInfo.currency || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right: PO Line Items */}
            <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-emerald-600" style={{ height: '40vh' }}>
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60">
                <h2 className="text-2xl font-bold text-emerald-300">Purchase Order Line Items</h2>
              </div>
              <div className="p-6 overflow-y-auto" style={{ height: 'calc(40vh - 80px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {poLineItems.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No line items found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Line</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Material</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Price</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700 text-slate-200">
                        {poLineItems.map((item, index) => (
                              <tr key={index} className="odd:bg-slate-900 even:bg-slate-800 hover:shadow-md transform hover:-translate-y-0.5 transition-shadow duration-150">
                            <td className="px-3 py-2 text-sm text-slate-100">{item["po-line-item"]}</td>
                            <td className="px-3 py-2 text-sm text-slate-200 max-w-xs truncate" title={item?.material?.matdescription}>
                              {item?.material?.matdescription || 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-200">
                              {item["po-quantity"]?.["$numberDecimal"] || item["po-quantity"] || '0'} {item["po-unit-of-measure"] || ''}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-200">{formatCurrency(item["po-unit-price"])}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-slate-100">{formatCurrency(item["po-value-sar"])}</td>
                            <td className="px-3 py-2 text-sm text-slate-200">
                              {item["pending-qty"]?.["$numberDecimal"] || item["pending-qty"] || '0'} {item["po-unit-of-measure"] || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* PO Schedule Section */}
          <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-violet-600">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60">
              <h2 className="text-2xl font-bold text-violet-300 mb-4">PO Schedule</h2>
              {poSchedule ? (
                <nav className="flex space-x-4 border-b border-slate-700">
                  {['general', 'payment', 'bank', 'lc', 'inspection', 'progress', 'shipping'].map((tab) => {
                    return (
                      <button
                        key={tab}
                        onClick={() => setScheduleTab(tab)}
                        className={`py-2 px-4 border-b-2 font-medium text-sm capitalize transition-colors ${
                          scheduleTab === tab
                            ? `border-violet-600 text-slate-100 bg-slate-800/60`
                            : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </nav>
              ) : (
                <p className="text-slate-300">No schedule data available</p>
              )}
            </div>
            {poSchedule && (
              <div className="p-6">
                {scheduleTab === 'general' && poSchedule.generaldata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(poSchedule.generaldata).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                        <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-slate-100">
                          {value instanceof Date ? formatDate(value) : value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleTab === 'payment' && poSchedule.paymentdata && (
                  <div className="space-y-4">
                    {poSchedule.paymentdata.advancePayments && poSchedule.paymentdata.advancePayments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-300 mb-2">Advance Payments</h3>
                        <div className="space-y-2">
                          {poSchedule.paymentdata.advancePayments.map((payment, idx) => (
                            <div key={idx} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Date</label>
                                  <p className="text-sm text-slate-100">{formatDate(payment.date)}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Amount</label>
                                  <p className="text-sm text-slate-100">{formatCurrency(payment.amount)}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Remarks</label>
                                  <p className="text-sm text-slate-100">{payment.remarks || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {poSchedule.paymentdata.milestonePayments && poSchedule.paymentdata.milestonePayments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-300 mb-2">Milestone Payments</h3>
                        <div className="space-y-2">
                          {poSchedule.paymentdata.milestonePayments.map((payment, idx) => (
                            <div key={idx} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Date</label>
                                  <p className="text-sm text-slate-100">{formatDate(payment.date)}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Amount</label>
                                  <p className="text-sm text-slate-100">{formatCurrency(payment.amount)}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-slate-300">Remarks</label>
                                  <p className="text-sm text-slate-100">{payment.remarks || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {poSchedule.paymentdata.finalPayment && (
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-300 mb-2">Final Payment</h3>
                        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Date</label>
                              <p className="text-sm text-slate-100">{formatDate(poSchedule.paymentdata.finalPayment.date)}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Amount</label>
                              <p className="text-sm text-slate-100">{formatCurrency(poSchedule.paymentdata.finalPayment.amount)}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Comments</label>
                              <p className="text-sm text-slate-100">{poSchedule.paymentdata.finalPayment.comments || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {scheduleTab === 'bank' && poSchedule.bgdata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(poSchedule.bgdata).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                        <label className="block text-xs font-semibold text-teal-700 mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-teal-900">
                          {value instanceof Date ? formatDate(value) : formatCurrency(value) || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleTab === 'lc' && poSchedule.lcdata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(poSchedule.lcdata).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                        <label className="block text-xs font-semibold text-cyan-700 mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-cyan-900">
                          {value instanceof Date ? formatDate(value) : value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleTab === 'inspection' && (
                  poSchedule.inspectiondata ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(poSchedule.inspectiondata).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                          <label className="block text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-sm text-indigo-900">
                            {value instanceof Date
                              ? formatDate(value)
                              : key.toLowerCase().includes('date') && value
                                ? formatDate(value)
                                : value || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-indigo-600 text-sm">No inspection data has been entered for this PO yet.</p>
                  )
                )}
                {scheduleTab === 'progress' && poSchedule.progressdata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(poSchedule.progressdata).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                        <label className="block text-xs font-semibold text-orange-700 mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-orange-900">
                          {value instanceof Date ? formatDate(value) : value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleTab === 'shipping' && poSchedule.shipdata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(poSchedule.shipdata).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                        <label className="block text-xs font-semibold text-red-700 mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-red-900">
                          {value instanceof Date ? formatDate(value) : value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle Section: Two Columns - Comments (Left) and Logs/Feedback (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: PO Comments */}
            <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-cyan-600">
              <div className="px-6 py-4 border-b bg-slate-800/60 border-slate-700">
                <h2 className="text-2xl font-bold text-slate-100">PO Comments</h2>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: '50vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {poComments.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No comments found</p>
                ) : (
                  <div className="space-y-4">
                    {poComments.map((comment, index) => (
                      <div key={index} className="bg-slate-800/60 rounded-lg p-5 border-2 border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-100 mb-2">{comment.title || 'Untitled Comment'}</h3>
                            <div 
                              className="text-sm text-slate-200 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: comment.comment || 'No content' }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-700">
                          <div className="text-xs font-semibold text-slate-300">
                            By: {comment.updatedBy || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDate(comment.updatedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: PO Logs and Feedback - Stacked */}
            <div className="space-y-6">
              {/* PO Logs */}
              <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-rose-600">
                <div className="px-6 py-4 border-b bg-slate-800/60 border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-100">PO Logs</h2>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '25vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {poLogs.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No logs found</p>
                  ) : (
                    <div className="space-y-4">
                      {poLogs.map((log, index) => (
                        <div key={index} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Title</label>
                              <p className="text-sm font-semibold text-slate-100">{log.title || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Project</label>
                              <p className="text-sm text-slate-200">{log.project || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Priority</label>
                              <p className="text-sm text-slate-200">{log.priority || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Status</label>
                              <p className="text-sm text-slate-200">{log.status || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs font-semibold text-slate-300">Request Info</label>
                              <p className="text-sm text-slate-200">{log.requestInfo || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Created By</label>
                              <p className="text-sm text-slate-200">{log.createdBy || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300">Created Date</label>
                              <p className="text-sm text-slate-200">{formatDate(log.createdDate)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PO Feedback */}
              <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-amber-600">
                <div className="px-6 py-4 border-b bg-slate-800/60 border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-100">PO Feedback</h2>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '25vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {poFeedback.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No feedback found</p>
                  ) : (
                    <div className="space-y-4">
                      {poFeedback.map((feedback, index) => (
                        <div key={index} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">{feedback.comment || 'N/A'}</p>
                              {feedback.poTitle && (
                                <p className="text-xs text-slate-300 mt-1">Title: {feedback.poTitle}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-300">{feedback.username || 'N/A'}</p>
                              <p className="text-xs text-slate-400">{formatDate(feedback.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery History Section */}
          <div className="bg-slate-900/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-cyan-600">
            <div className="px-6 py-4 border-b bg-slate-800/60 border-slate-700">
              <h2 className="text-2xl font-bold text-cyan-300">Delivery History</h2>
            </div>
            <div className="p-6">
              {deliveryHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No delivery history found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 text-slate-300">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">PO Line</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Doc Number</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Doc Line</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Movement Type</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Value</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Doc Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Posted Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Entered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-200">
                      {deliveryHistory.map((delivery, index) => (
                        <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-2 text-sm text-slate-100">{delivery.polineitem || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">{delivery.documentnumber || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">{delivery.documentlineitem || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">{delivery.movementtype || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">
                            {delivery.documentqty 
                              ? (delivery.documentqty.$numberDecimal 
                                  ? parseFloat(delivery.documentqty.$numberDecimal).toLocaleString() 
                                  : typeof delivery.documentqty === 'number' 
                                    ? delivery.documentqty.toLocaleString() 
                                    : String(delivery.documentqty))
                              : '0'} {delivery.uom || ''}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-200">
                            {formatCurrency(delivery.documentvalue)}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-200">{formatDate(delivery.documentdate)}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">{formatDate(delivery.documentposteddate)}</td>
                          <td className="px-3 py-2 text-sm text-slate-200">{formatDate(delivery.documententereddate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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

export default PurchaseOrderDetail;
