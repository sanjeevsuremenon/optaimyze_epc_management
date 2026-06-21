import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Upload, Download, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function BulkImportModal({ isOpen, onClose, onImport, fields, tabLabel, globalData }) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [rawRows, setRawRows] = useState([]);
  const [blockMismatches, setBlockMismatches] = useState(false);
  
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [validationRun, setValidationRun] = useState(false);
  
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset modal state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setRawRows([]);
      setParsedData([]);
      setErrors([]);
      setWarnings([]);
      setValidationRun(false);
      setResult(null);
      setBlockMismatches(false);
    }
  }, [isOpen]);

  // Re-validate when raw rows or strictness mode changes
  useEffect(() => {
    if (rawRows.length > 0) {
      validateAndParse(rawRows);
    }
  }, [rawRows, blockMismatches]);

  if (!isOpen || !mounted) return null;

  const primaryKeys = fields.filter(f => f.isKey);
  const mandatoryFields = fields.filter(f => f.required);

  const downloadCSVTemplate = () => {
    const headers = fields.map(f => `${f.key}${f.required ? '*' : ''}`).join(",");
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tabLabel.toLowerCase().replace(/\s+/g, "_")}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadXLSXTemplate = () => {
    const headers = fields.map(f => `${f.key}${f.required ? '*' : ''}`);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${tabLabel.toLowerCase().replace(/\s+/g, "_")}_template.xlsx`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setRawRows([]);
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setValidationRun(false);

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

    if (fileExtension === "csv") {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => {
          setRawRows(results.data);
        },
        error: (err) => {
          setErrors([`Failed to parse CSV file: ${err.message}`]);
        }
      });
    } else if (["xlsx", "xls"].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          setRawRows(jsonData);
        } catch (err) {
          setErrors([`Failed to parse Excel file: ${err.message}`]);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setErrors(["Unsupported file format. Please upload a .csv, .xlsx, or .xls file."]);
    }
  };

  const validateAndParse = (rawData) => {
    if (!rawData || rawData.length === 0) {
      setErrors(["The uploaded file is empty or has no rows."]);
      return;
    }

    const validationErrors = [];
    const validationWarnings = [];
    const cleanData = [];

    // Map headers to field keys (robust mapping handles key, label, case, trailing *)
    const headerMap = {};
    fields.forEach(f => {
      const cleanKey = f.key.toLowerCase().trim();
      const cleanLabel = f.label.toLowerCase().trim();
      headerMap[cleanKey] = f.key;
      headerMap[cleanLabel] = f.key;
    });

    rawData.forEach((row, index) => {
      const rowNum = index + 1;
      const cleanRow = {};
      
      // Map row keys to our fields keys
      Object.keys(row).forEach(header => {
        const cleanHeader = header.replace(/\*$/, '').toLowerCase().trim();
        const targetKey = headerMap[cleanHeader];
        if (targetKey) {
          cleanRow[targetKey] = String(row[header]).trim();
        }
      });

      // Skip entirely empty mapped rows
      const hasContent = Object.values(cleanRow).some(v => v !== "");
      if (!hasContent) return;

      const missingMandatory = [];
      fields.forEach(f => {
        const val = cleanRow[f.key];
        if (f.required) {
          if (val === undefined || val === null || val === "") {
            missingMandatory.push(f.label);
          }
        }
      });

      if (missingMandatory.length > 0) {
        validationErrors.push(`Row ${rowNum}: Missing mandatory fields: ${missingMandatory.join(", ")}`);
      }

      // Check dependent dynamic-select values (warnings/errors for unknown designations/departments)
      if (globalData) {
        if (cleanRow.designation) {
          const exists = globalData.designations?.some(d => d.name.toLowerCase() === cleanRow.designation.toLowerCase());
          if (!exists) {
            const msg = `Row ${rowNum}: Designation "${cleanRow.designation}" is not in designation master data.`;
            if (blockMismatches) {
              validationErrors.push(msg);
            } else {
              validationWarnings.push(msg + " It will be saved, but won't match standard selections.");
            }
          }
        }
        if (cleanRow.department) {
          const exists = globalData.departments?.some(d => d.name.toLowerCase() === cleanRow.department.toLowerCase());
          if (!exists) {
            const msg = `Row ${rowNum}: Department "${cleanRow.department}" is not in department master data.`;
            if (blockMismatches) {
              validationErrors.push(msg);
            } else {
              validationWarnings.push(msg);
            }
          }
        }
        if (cleanRow.grade) {
          const exists = globalData['employee-grades']?.some(g => g.grade.toLowerCase() === cleanRow.grade.toLowerCase());
          if (!exists) {
            const msg = `Row ${rowNum}: Grade "${cleanRow.grade}" is not in employee-grades master data.`;
            if (blockMismatches) {
              validationErrors.push(msg);
            } else {
              validationWarnings.push(msg);
            }
          }
        }
        if (cleanRow.salaryLevel) {
          const exists = globalData['employee-salary-levels']?.some(s => s.level.toLowerCase() === cleanRow.salaryLevel.toLowerCase());
          if (!exists) {
            const msg = `Row ${rowNum}: Salary Level "${cleanRow.salaryLevel}" is not in salary level master data.`;
            if (blockMismatches) {
              validationErrors.push(msg);
            } else {
              validationWarnings.push(msg);
            }
          }
        }
      }

      // Validate select fields options (e.g. status must be Active/Inactive)
      fields.forEach(f => {
        if (f.type === "select" && f.options && cleanRow[f.key]) {
          const matchedOption = f.options.some(opt => opt.value.toLowerCase() === cleanRow[f.key].toLowerCase());
          if (!matchedOption) {
            validationErrors.push(`Row ${rowNum}: "${cleanRow[f.key]}" is not a valid option for "${f.label}". Must be one of: ${f.options.map(o => o.label).join(", ")}`);
          } else {
            // Standardize case to match option
            const matchingOpt = f.options.find(opt => opt.value.toLowerCase() === cleanRow[f.key].toLowerCase());
            cleanRow[f.key] = matchingOpt.value;
          }
        }
      });

      cleanData.push(cleanRow);
    });

    setParsedData(cleanData);
    setErrors(validationErrors);
    setWarnings(validationWarnings);
    setValidationRun(true);
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0 || errors.length > 0) return;
    
    setImporting(true);
    setResult(null);

    try {
      const res = await onImport(parsedData);
      const isSuccess = res === true || (res && typeof res === 'object' && res.success !== false);
      
      if (isSuccess) {
        let statsMsg = "";
        if (res && typeof res === 'object') {
          const matched = res.matchedCount !== undefined ? res.matchedCount : null;
          const modified = res.modifiedCount !== undefined ? res.modifiedCount : null;
          const upserted = res.upsertedCount !== undefined ? res.upsertedCount : null;
          
          if (matched !== null || modified !== null || upserted !== null) {
            statsMsg = `\n- Matched: ${matched ?? 0}\n- Modified: ${modified ?? 0}\n- Upserted/Inserted: ${upserted ?? 0}`;
          }
        }
        alert(`Bulk import completed successfully!${statsMsg}`);
        onClose();
      } else {
        const errorMsg = (res && typeof res === 'object' && res.error) ? res.error : "Failed to perform bulk import. Please check connection and try again.";
        setResult({
          success: false,
          message: errorMsg
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.message || "An error occurred during bulk import."
      });
    } finally {
      setImporting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-app-surface-muted backdrop-blur-sm transition-opacity p-4 sm:p-6 mt-16 sm:mt-0">
      <div className="app-card rounded-xl shadow-2xl w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-app-border flex justify-between items-center bg-app-surface-muted rounded-t-xl shrink-0">
          <h3 className="text-lg font-bold text-app-text flex items-center gap-2">
            <Upload size={20} className="text-app-accent" />
            Bulk Import - {tabLabel}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-6">
          
          {/* Instructions and templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-app-surface-muted border border-app-border/50 rounded-lg p-5">
            <div>
              <h4 className="text-sm font-semibold text-app-text mb-2">Import Guidelines</h4>
              <ul className="text-xs text-app-text-muted space-y-2 list-disc list-inside">
                <li>Download the Excel or CSV template, fill it with your data, and upload it below.</li>
                <li>Mandatory fields are marked with <span className="text-rose-400 font-bold">*</span> in the table/template.</li>
                <li>
                  Columns marked as <span className="text-app-accent font-semibold">Primary Key/s</span> will be used to locate matches.
                  If a record matches the primary key, it will be <span className="text-amber-400 font-medium">updated/overwritten</span>.
                  Otherwise, a new record is created.
                </li>
                <li>For dropdown fields (Designation, Department, etc.), verify standard matches are filled to prevent warnings.</li>
              </ul>
            </div>
            
            <div className="flex flex-col justify-center items-center gap-3 md:border-l md:border-slate-800 md:pl-6">
              <span className="text-xs text-app-text-muted font-medium mb-1">Download Suggestive Schema Templates:</span>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadXLSXTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 rounded-md text-xs font-semibold transition-all"
                >
                  <Download size={14} /> Excel Template (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-app-accent/20 hover:bg-app-accent/30 text-app-accent border border-app-accent/20 hover:border-app-accent/40 rounded-md text-xs font-semibold transition-all"
                >
                  <Download size={14} /> CSV Template (.csv)
                </button>
              </div>
            </div>
          </div>

          {/* Schema specifications */}
          <div>
            <h4 className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-2">Schema Definitions</h4>
            <div className="overflow-x-auto border border-app-border/60 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-app-surface-muted/80 border-b border-app-border text-app-text-secondary">
                    <th className="px-4 py-2 font-semibold">Column / Key</th>
                    <th className="px-4 py-2 font-semibold">Field Name</th>
                    <th className="px-4 py-2 font-semibold text-center">Required?</th>
                    <th className="px-4 py-2 font-semibold text-center">Key Type</th>
                    <th className="px-4 py-2 font-semibold">Field Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/40 bg-app-surface/20">
                  {fields.map(f => (
                    <tr key={f.key} className="hover:bg-app-surface/10">
                      <td className="px-4 py-2 font-mono text-app-accent">{f.key}</td>
                      <td className="px-4 py-2 text-app-text">{f.label}</td>
                      <td className="px-4 py-2 text-center">
                        {f.required ? (
                          <span className="text-rose-400 font-bold">Yes *</span>
                        ) : (
                          <span className="text-app-text-muted">No</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {f.isKey ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-app-accent border border-app-accent/20">Primary Key</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-app-text-muted italic">
                        {f.type === "select" && f.options ? `Options: ${f.options.map(o => o.label).join("/")}` : f.type === "dynamic-select" ? `Select from ${f.key} masters` : `Text entry`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Strictness Toggle */}
          <div className="flex items-start gap-3 bg-app-surface-muted p-4 border border-app-border/60 rounded-xl">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="block-mismatches"
                type="checkbox"
                checked={blockMismatches}
                onChange={(e) => setBlockMismatches(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-app-bg text-cyan-500 focus:ring-app-accent/50 cursor-pointer"
              />
            </div>
            <label htmlFor="block-mismatches" className="text-xs text-app-text-secondary cursor-pointer select-none">
              <span className="text-app-text font-bold block mb-0.5">Strict Validation Mode</span>
              If checked, unrecognized designations, departments, grades, or salary levels will be treated as <span className="text-rose-450 font-bold">blocking errors</span>. Otherwise, they will be reported as <span className="text-amber-400 font-semibold">warnings</span> and allowed to import.
            </label>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-cyan-400 bg-app-accent/5"
                : file
                ? "border-emerald-500 bg-emerald-500/5 hover:border-emerald-400"
                : "border-slate-600 bg-app-surface-muted hover:border-slate-500 hover:bg-app-surface-muted"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <Upload size={32} className={file ? "text-emerald-400" : "text-app-text-muted"} />
              {file ? (
                <div>
                  <span className="text-sm font-semibold text-app-text block">{file.name}</span>
                  <span className="text-xs text-app-text-muted block mt-1">{(file.size / 1024).toFixed(1)} KB — Click or drag to change file</span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-semibold text-app-text-secondary block">Drag & Drop file here, or click to browse</span>
                  <span className="text-xs text-app-text-muted block mt-1">Accepts CSV, XLSX or XLS formats</span>
                </div>
              )}
            </div>
          </div>

          {/* Validations & Parsing Results */}
          {validationRun && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-app-surface-muted/80 p-4 border border-app-border/60 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-app-text">{parsedData.length} records parsed</span>
                </div>
                {errors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-rose-455">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">{errors.length} validation errors</span>
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">{warnings.length} warnings</span>
                  </div>
                )}
              </div>

              {/* Show errors (blocking) */}
              {errors.length > 0 && (
                <div className="bg-rose-950/15 border border-rose-900/40 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Errors (Correct before importing)</h4>
                  <ul className="text-xs text-rose-300/80 space-y-1 font-mono">
                    {errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show warnings (non-blocking) */}
              {warnings.length > 0 && (
                <div className="bg-amber-950/10 border border-amber-900/30 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Warnings (Informational, will not block import)</h4>
                  <ul className="text-xs text-amber-300/80 space-y-1 font-mono">
                    {warnings.map((warn, i) => (
                      <li key={i}>• {warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Execution Result */}
          {result && (
            <div className={`p-4 border rounded-lg flex items-start gap-3 ${
              result.success 
                ? "bg-emerald-950/15 border-emerald-900/40 text-emerald-300"
                : "bg-rose-950/15 border-rose-900/40 text-rose-300"
            }`}>
              {result.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold">{result.success ? "Success" : "Failed"}</p>
                <p className="text-xs opacity-90 mt-0.5">{result.message}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border flex justify-end gap-3 bg-app-surface/80 rounded-b-xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-app-text-secondary hover:bg-app-surface-muted hover:text-app-text transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={parsedData.length === 0 || errors.length > 0 || importing || !!(result && result.success)}
            onClick={handleImportSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium text-slate-950 bg-app-accent hover:bg-app-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-500/20"
          >
            {importing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Importing...
              </>
            ) : (
              "Run Bulk Import"
            )}
          </button>
        </div>

      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 20px;
        }
      `}</style>
    </div>,
    document.body
  );
}
