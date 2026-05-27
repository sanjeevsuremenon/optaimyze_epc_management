import { connectToDatabase } from "../../../../../lib/mongoconnect";
import XLSX from 'xlsx';
import moment from 'moment';

const handler = async (req, res) => {
  const { projectid, network } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // Build query: by project (WBS) or by network when network param is provided
    const query = network
      ? {
          "account.network": network,
          $or: [
            { "account.wbs": { $exists: false } },
            { "account.wbs": null }
          ]
        }
      : {
          $expr: {
            $eq: [{ $substr: ["$account.wbs", 0, 12] }, projectid]
          }
        };

    const purchaseorders = await db
      .collection("purchaseorders")
      .find(query)
      .toArray();

    // Get unique PO numbers
    const uniquePOs = [...new Set(purchaseorders.map(po => po["po-number"]))];

    // Prepare data for Excel
    const excelData = [];

    for (const ponumber of uniquePOs) {
      // Get PO basic info from first occurrence
      const poRecord = purchaseorders.find(po => po["po-number"] === ponumber);
      const vendorcode = poRecord?.["vendorcode"] || poRecord?.["vendor-code"] || "";
      const vendorname = poRecord?.["vendorname"] || poRecord?.["vendor-name"] || "";
      const podate = poRecord?.["po-date"] || "";
      
      // Calculate PO value and balance
      const poval = purchaseorders
        .filter(po => po["po-number"] === ponumber)
        .reduce((sum, po) => sum + (po["po-value-sar"] || 0), 0);
      const balgrval = purchaseorders
        .filter(po => po["po-number"] === ponumber)
        .reduce((sum, po) => sum + (po["pending-val-sar"] || 0), 0);

      // Fetch schedule data for this PO
      const scheduleData = await db.collection('poschedule').findOne({ ponumber });

      // Helper function to format date - returns Date object for Excel
      const formatDate = (date) => {
        if (!date) return null;
        if (typeof date === 'string') {
          const parsed = new Date(date);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        if (date instanceof Date) {
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      };

      // Helper function to format date as string for display in payment arrays
      const formatDateString = (date) => {
        const dateObj = formatDate(date);
        return dateObj ? moment(dateObj).format('MM/DD/YYYY') : '';
      };

      // Helper function to format payment arrays
      const formatPaymentArray = (payments) => {
        if (!payments || !Array.isArray(payments) || payments.length === 0) return '';
        return payments
          .map(p => {
            const date = formatDateString(p.date);
            const amount = p.amount || '';
            const remarks = p.remarks || '';
            return `${date} - ${amount}${remarks ? ` (${remarks})` : ''}`;
          })
          .join('; ');
      };

      // Build row data
      const row = {
        'PO Number': ponumber || '',
        'PO Date': formatDate(podate),
        'Vendor Code': vendorcode || '',
        'Vendor Name': vendorname || '',
        'PO Value (SAR)': poval || 0,
        'Balance (SAR)': balgrval || 0,
        
        // General Data
        'PO Acknowledgment Date': formatDate(scheduleData?.generaldata?.poackdate),
        'PO Delivery Date': formatDate(scheduleData?.generaldata?.podelydate),
        'Estimated Delivery Date': formatDate(scheduleData?.generaldata?.estdelydate),
        'Delivery Schedule': scheduleData?.generaldata?.delysch || '',
        'Base Design Received Date': formatDate(scheduleData?.generaldata?.basedesignrecdate),
        'Base Design Approval Date': formatDate(scheduleData?.generaldata?.basedesignapprdate),
        'Base Design Comments': scheduleData?.generaldata?.basedesigncomments || '',
        'Detailed Design Received Date': formatDate(scheduleData?.generaldata?.detdesignrecdate),
        'Detailed Design Approval Date': formatDate(scheduleData?.generaldata?.detdesignaprdate),
        'Manufacturing Clearance Date': formatDate(scheduleData?.generaldata?.mfgclearancedate),
        'ITP Approval Date': formatDate(scheduleData?.generaldata?.itpapprdate),
        
        // Payment Data - Handle both old and new structure
        'Advance Payment Date': scheduleData?.paymentdata?.advpaiddate 
          ? formatDate(scheduleData.paymentdata.advpaiddate)
          : formatPaymentArray(scheduleData?.paymentdata?.advancePayments),
        'Advance Payment Amount': scheduleData?.paymentdata?.advamountpaid 
          || (scheduleData?.paymentdata?.advancePayments?.[0]?.amount || ''),
        'Milestone Payment Date': scheduleData?.paymentdata?.milestoneamountpaiddate
          ? formatDate(scheduleData.paymentdata.milestoneamountpaiddate)
          : formatPaymentArray(scheduleData?.paymentdata?.milestonePayments),
        'Milestone Payment Amount': scheduleData?.paymentdata?.milestoneamountpaid
          || (scheduleData?.paymentdata?.milestonePayments?.[0]?.amount || ''),
        'Final Payment Date': scheduleData?.paymentdata?.finalpaiddate
          ? formatDate(scheduleData.paymentdata.finalpaiddate)
          : formatDate(scheduleData?.paymentdata?.finalPayment?.date),
        'Final Payment Amount': scheduleData?.paymentdata?.finalpaidamt
          || scheduleData?.paymentdata?.finalPayment?.amount || '',
        'Final Payment Comments': scheduleData?.paymentdata?.finalcomments
          || scheduleData?.paymentdata?.finalPayment?.comments || '',
        
        // Bank Guarantee Data
        'ABG Expected Date': formatDate(scheduleData?.bgdata?.abgestdate),
        'ABG Actual Date': formatDate(scheduleData?.bgdata?.abgactualdate),
        'ABG Expiry Date': formatDate(scheduleData?.bgdata?.abgexpirydate),
        'ABG Amount': scheduleData?.bgdata?.abgamount || 0,
        'ABG Returned Date': formatDate(scheduleData?.bgdata?.abgreturneddate),
        'PBG Expected Date': formatDate(scheduleData?.bgdata?.pbgestdate),
        'PBG Actual Date': formatDate(scheduleData?.bgdata?.pbgactualdate),
        'PBG Expiry Date': formatDate(scheduleData?.bgdata?.pbgexpirydate),
        'PBG Returned Date': formatDate(scheduleData?.bgdata?.pbgreturneddate),
        'PBG Amount': scheduleData?.bgdata?.pbgamount || '',
        'BG Remarks': scheduleData?.bgdata?.bgremarks || '',
        
        // LC Data
        'LC Data Date': formatDate(scheduleData?.lcdata?.lcdatadate),
        'LC Expected Open Date': formatDate(scheduleData?.lcdata?.lcestopendate),
        'LC Opened Date': formatDate(scheduleData?.lcdata?.lcopeneddate),
        'LC Expiry Date': formatDate(scheduleData?.lcdata?.lcexpirydate),
        'LC Last Ship Date': formatDate(scheduleData?.lcdata?.lclastshipdate),
        'LC Incoterm': scheduleData?.lcdata?.lcincoterm || '',
        'LC Documents': scheduleData?.lcdata?.lcdocuments || '',
        'LC Amount': scheduleData?.lcdata?.lcamount || '',
        'LC Remarks': scheduleData?.lcdata?.lcremarks || '',
        'LC Swift': scheduleData?.lcdata?.lcswift || '',
        
        // Progress Data
        'Manufacturing Start Date': formatDate(scheduleData?.progressdata?.mfgstart),
        'BL Date': formatDate(scheduleData?.progressdata?.Bldate),
        'FAT Date': formatDate(scheduleData?.progressdata?.Fatdate),
        'FAT Report Date': formatDate(scheduleData?.progressdata?.Fatreportdate),
        'Vessel Reached Date': formatDate(scheduleData?.progressdata?.vesselreacheddate),
        'Customs Cleared Date': formatDate(scheduleData?.progressdata?.customscleareddate),
        
        // Shipment Data
        'Shipment Booked Date': formatDate(scheduleData?.shipdata?.shipmentbookeddate),
        'Gross Weight': scheduleData?.shipdata?.grossweight || '',
        'SABER Applied Date': formatDate(scheduleData?.shipdata?.saberapplieddate),
        'SABER Received Date': formatDate(scheduleData?.shipdata?.saberreceiveddate),
        'FF Nominated Date': formatDate(scheduleData?.shipdata?.ffnoMinateddate),
        'Final Remarks': scheduleData?.shipdata?.finalremarks || ''
      };

      excelData.push(row);
    }

    // Create workbook and worksheet
    // Note: json_to_sheet converts Date objects to strings, so we'll fix dates manually
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PO Schedule Data');
    
    // Get worksheet range
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Define date columns (0-indexed)
    const dateColumns = [
      1,  // PO Date
      6,  // PO Acknowledgment Date
      7,  // PO Delivery Date
      8,  // Estimated Delivery Date
      10, // Base Design Received Date
      11, // Base Design Approval Date
      13, // Detailed Design Received Date
      14, // Detailed Design Approval Date
      15, // Manufacturing Clearance Date
      16, // ITP Approval Date
      17, // Advance Payment Date (may be string if multiple payments)
      19, // Milestone Payment Date (may be string if multiple payments)
      21, // Final Payment Date
      24, // ABG Expected Date
      25, // ABG Actual Date
      26, // ABG Expiry Date
      27, // ABG Returned Date
      28, // PBG Expected Date
      29, // PBG Actual Date
      30, // PBG Expiry Date
      31, // PBG Returned Date
      33, // LC Data Date
      34, // LC Expected Open Date
      35, // LC Opened Date
      36, // LC Expiry Date
      37, // LC Last Ship Date
      40, // Manufacturing Start Date
      41, // BL Date
      42, // FAT Date
      43, // FAT Report Date
      44, // Vessel Reached Date
      45, // Customs Cleared Date
      46, // Shipment Booked Date
      48, // SABER Applied Date
      49, // SABER Received Date
      50  // FF Nominated Date
    ];

    // Process date columns - convert date strings/objects to Excel serial numbers
    dateColumns.forEach(colIndex => {
      for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (worksheet[cellAddress] && worksheet[cellAddress].v) {
          const cell = worksheet[cellAddress];
          let dateValue = cell.v;
          
          // If it's already a Date object, convert to Excel serial
          if (dateValue instanceof Date) {
            const excelEpoch = new Date(1900, 0, 1);
            const diffTime = dateValue - excelEpoch;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            dateValue = diffDays + 1; // Excel day 1 is 1900-01-01
          } 
          // If it's a string that looks like a date, parse it
          else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            // Try to parse various date formats
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) {
              const excelEpoch = new Date(1900, 0, 1);
              const diffTime = parsed - excelEpoch;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              dateValue = diffDays + 1;
            } else {
              // If it's a payment array string, leave it as is
              continue;
            }
          } else {
            continue;
          }
          
          // Set the cell value and format
          cell.v = dateValue;
          cell.t = 'n'; // number type
          cell.z = 'mm/dd/yyyy'; // date format
        }
      }
    });

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // PO Number
      { wch: 12 }, // PO Date
      { wch: 15 }, // Vendor Code
      { wch: 30 }, // Vendor Name
      { wch: 15 }, // PO Value
      { wch: 15 }, // Balance
      { wch: 22 }, // PO Acknowledgment Date
      { wch: 18 }, // PO Delivery Date
      { wch: 22 }, // Estimated Delivery Date
      { wch: 25 }, // Delivery Schedule
      { wch: 25 }, // Base Design Received Date
      { wch: 25 }, // Base Design Approval Date
      { wch: 25 }, // Base Design Comments
      { wch: 28 }, // Detailed Design Received Date
      { wch: 28 }, // Detailed Design Approval Date
      { wch: 28 }, // Manufacturing Clearance Date
      { wch: 18 }, // ITP Approval Date
      { wch: 25 }, // Advance Payment Date
      { wch: 22 }, // Advance Payment Amount
      { wch: 25 }, // Milestone Payment Date
      { wch: 25 }, // Milestone Payment Amount
      { wch: 20 }, // Final Payment Date
      { wch: 20 }, // Final Payment Amount
      { wch: 25 }, // Final Payment Comments
      { wch: 20 }, // ABG Expected Date
      { wch: 18 }, // ABG Actual Date
      { wch: 18 }, // ABG Expiry Date
      { wch: 15 }, // ABG Amount
      { wch: 20 }, // ABG Returned Date
      { wch: 20 }, // PBG Expected Date
      { wch: 18 }, // PBG Actual Date
      { wch: 18 }, // PBG Expiry Date
      { wch: 20 }, // PBG Returned Date
      { wch: 15 }, // PBG Amount
      { wch: 20 }, // BG Remarks
      { wch: 18 }, // LC Data Date
      { wch: 22 }, // LC Expected Open Date
      { wch: 18 }, // LC Opened Date
      { wch: 18 }, // LC Expiry Date
      { wch: 20 }, // LC Last Ship Date
      { wch: 15 }, // LC Incoterm
      { wch: 20 }, // LC Documents
      { wch: 15 }, // LC Amount
      { wch: 20 }, // LC Remarks
      { wch: 15 }, // LC Swift
      { wch: 25 }, // Manufacturing Start Date
      { wch: 15 }, // BL Date
      { wch: 15 }, // FAT Date
      { wch: 20 }, // FAT Report Date
      { wch: 22 }, // Vessel Reached Date
      { wch: 22 }, // Customs Cleared Date
      { wch: 22 }, // Shipment Booked Date
      { wch: 15 }, // Gross Weight
      { wch: 20 }, // SABER Applied Date
      { wch: 20 }, // SABER Received Date
      { wch: 20 }, // FF Nominated Date
      { wch: 30 }  // Final Remarks
    ];
    worksheet['!cols'] = columnWidths;

    // Generate Excel file buffer with cellDates option to properly handle dates
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellDates: true,
      dateNF: 'mm/dd/yyyy'
    });

    // Set response headers for file download
    // Clean filename to ensure proper extension
    const cleanProjectId = (projectid || '').replace(/[^a-zA-Z0-9]/g, '_');
    const suffix = network ? `Network_${network}` : cleanProjectId;
    const filename = `PO_Schedule_${suffix}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // Use both filename and filename* for better browser compatibility
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Failed to generate Excel file', details: error.message });
  }
};

export default handler;





