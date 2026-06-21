import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faDollarSign, faShip } from "@fortawesome/free-solid-svg-icons";

export default function POTimeline({ ponumber }) {
  const [poLineItems, setPOLineItems] = useState([]);
  const [poSchedule, setPOSchedule] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [basicInfo, setBasicInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ponumber) return;

    const fetchTimelineData = async () => {
      setLoading(true);
      try {
        const [
          poResponse,
          scheduleResponse,
          deliveryResponse
        ] = await Promise.all([
          fetch(`/api/purchaseorders/porder/${ponumber}`),
          fetch(`/api/purchaseorders/schedule/generaldata/${ponumber}`),
          fetch(`/api/materialdocumentsforpo/${ponumber}`)
        ]);

        if (poResponse.ok) {
          const poData = await poResponse.json();
          if (poData && poData.length > 0) {
            setPOLineItems(poData);
            const firstRecord = poData[0];
            setBasicInfo({
              ponumber: firstRecord["po-number"] || ponumber,
              podate: firstRecord["po-date"],
              "delivery-date": firstRecord["delivery-date"],
              vendorcode: firstRecord.vendorcode || firstRecord["vendor-code"] || "",
              vendorname: firstRecord.vendorname || firstRecord["vendor-name"] || "",
              plant: firstRecord["plant-code"] || "",
              currency: firstRecord.currency || ""
            });
          }
        }

        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setPOSchedule(scheduleData);
        } else if (scheduleResponse.status === 404) {
          setPOSchedule(null);
        }

        if (deliveryResponse.ok) {
          const deliveryData = await deliveryResponse.json();
          setDeliveryHistory(deliveryData || []);
        }

      } catch (error) {
        console.error('Error fetching PO details for timeline:', error);
      }
      setLoading(false);
    };

    fetchTimelineData();
  }, [ponumber]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

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

    const startDate = basicInfo.podate 
      ? moment(basicInfo.podate).startOf('month')
      : moment().startOf('month');

    let endDate;
    
    const actualDeliveryDates = events
      .filter(e => e.type === 'actual-delivery')
      .map(e => e.date)
      .sort((a, b) => b.valueOf() - a.valueOf());
    
    const lastDeliveryDate = actualDeliveryDates.length > 0 ? actualDeliveryDates[0] : null;
    
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
    
    const isFullyDelivered = totalOrdered > 0 && totalDelivered >= totalOrdered;
    
    if (isFullyDelivered && lastDeliveryDate) {
      endDate = lastDeliveryDate.clone().endOf('month');
    } else {
      const sixMonthsFuture = now.clone().add(6, 'months').endOf('month');
      const plannedDeliveryEnd = basicInfo["delivery-date"] 
        ? moment(basicInfo["delivery-date"]).endOf('month')
        : null;
      
      if (plannedDeliveryEnd && plannedDeliveryEnd.isAfter(sixMonthsFuture)) {
        endDate = plannedDeliveryEnd;
      } else {
        endDate = sixMonthsFuture;
      }
    }

    events.sort((a, b) => a.date.valueOf() - b.date.valueOf());

    return { startDate, endDate, events };
  };

  const timeline = calculateTimeline();

  if (loading) {
    return (
      <div className="bg-app-surface border border-app-border rounded-xl p-8 shadow-lg flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
      </div>
    );
  }

  if (!timeline.startDate || !timeline.endDate) {
    return (
      <div className="bg-app-surface border border-app-border rounded-xl p-8 shadow-lg flex justify-center text-app-text-muted italic">
        Not enough PO data available to generate a timeline.
      </div>
    );
  }

  const start = timeline.startDate;
  const end = timeline.endDate;
  const totalMonths = end.diff(start, 'months') + 1;
  const months = [];
  
  let current = start.clone();
  while (current.isSameOrBefore(end, 'month')) {
    months.push(current.clone());
    current.add(1, 'month');
  }

  const getEventPosition = (eventDate) => {
    const monthsDiff = eventDate.diff(start, 'months', true);
    return (monthsDiff / totalMonths) * 100;
  };

  return (
    <div className="bg-app-surface/80 rounded-xl shadow-lg overflow-hidden border-l-4 border-cyan-600 p-6 text-app-text">
      <h2 className="text-2xl font-bold text-app-accent mb-6">PO Timeline</h2>
      
      <div className="relative mb-8" style={{ height: '120px' }}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-app-surface/40 rounded-full"></div>
        
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
          
          let iconElement = null;
          if (event.icon === 'gear') {
            iconElement = <FontAwesomeIcon icon={faCog} className="text-app-text text-xs" />;
          } else if (event.icon === 'dollar') {
            iconElement = <FontAwesomeIcon icon={faDollarSign} className="text-app-text text-xs" />;
          } else if (event.icon === 'ship') {
            iconElement = <FontAwesomeIcon icon={faShip} className="text-app-text text-xs" />;
          }
          
          return (
            <div
              key={idx}
              className="absolute"
              style={{ left: `${position}%`, transform: 'translateX(-50%)', top: '20px' }}
            >
              <div className={`w-6 h-6 rounded-full border-2 ${colorClasses[event.color] || 'bg-gray-500'} relative group flex items-center justify-center`}>
                {iconElement}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-app-surface text-app-text text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                  <div className="font-semibold mb-1">{event.milestone || event.label}</div>
                  <div className="text-app-text-secondary">{event.date.format('MM/DD/YYYY')}</div>
                  {event.label !== event.milestone && (
                    <div className="text-app-text-secondary mt-1">{event.label}</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-app-text-secondary mt-2 text-center" style={{ width: '80px', marginLeft: '-40px' }}>
                {event.date.format('MM/DD')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-sm mt-12">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-app-accent border-2 border-cyan-600"></div>
          <span className="text-app-accent">PO Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-600"></div>
          <span className="text-emerald-300">Planned Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-500 border-2 border-violet-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faCog} className="text-app-text text-xs" />
          </div>
          <span className="text-violet-300">Design Related</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faDollarSign} className="text-app-text text-xs" />
          </div>
          <span className="text-emerald-300">Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-app-accent border-2 border-cyan-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faShip} className="text-app-text text-xs" />
          </div>
          <span className="text-app-accent">LC Related</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-600"></div>
          <span className="text-orange-300">Actual Delivery</span>
        </div>
      </div>
    </div>
  );
}
