import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FiSave, FiX, FiTruck } from 'react-icons/fi';
import { toast } from "react-toastify";
import useDebounce from '../../lib/useDebounce';

function DeliveryForm({ onClose, onSave }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isModal = typeof onClose === 'function';
  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
    else router.push('/tracking');
  };
  const handleSaveComplete = (savedLog) => {
    if (typeof onSave === 'function') onSave(savedLog);
    else router.push('/tracking');
  };
  const [formData, setFormData] = useState({
    project: "",
    title: "",
    priority: "Info",
    deliveryReference: "",
    poNumber: "",
    requestInfo: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectInput, setProjectInput] = useState("");
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOtherProject, setIsOtherProject] = useState(false);
  const [poNumberInput, setPoNumberInput] = useState("");
  const [poNumberSuggestions, setPoNumberSuggestions] = useState([]);
  const [showPoNumberSuggestions, setShowPoNumberSuggestions] = useState(false);
  const [isOtherPoNumber, setIsOtherPoNumber] = useState(false);
  const debouncedProjectInput = useDebounce(projectInput, 400);
  const debouncedPoNumberInput = useDebounce(poNumberInput, 400);

  useEffect(() => {
    if (debouncedProjectInput && debouncedProjectInput.length >= 2) {
      fetch(`/api/projects?str=${debouncedProjectInput}`)
        .then(res => res.json())
        .then(data => {
          setProjectSuggestions(Array.isArray(data) && data.length ? data : []);
          setShowSuggestions(true);
        });
    } else {
      setProjectSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedProjectInput]);

  useEffect(() => {
    if (debouncedPoNumberInput && debouncedPoNumberInput.length >= 3) {
      fetch(`/api/purchaseorders/search?str=${encodeURIComponent(debouncedPoNumberInput)}`)
        .then(res => res.json())
        .then(data => {
          setPoNumberSuggestions(Array.isArray(data) && data.length ? data : []);
          setShowPoNumberSuggestions(true);
        })
        .catch(() => {
          setPoNumberSuggestions([]);
          setShowPoNumberSuggestions(false);
        });
    } else {
      setPoNumberSuggestions([]);
      setShowPoNumberSuggestions(false);
    }
  }, [debouncedPoNumberInput]);

  const handleProjectInputChange = (e) => {
    setProjectInput(e.target.value);
    setFormData(prev => ({ ...prev, project: e.target.value }));
    setIsOtherProject(false);
    if (errors.project) setErrors(prev => ({ ...prev, project: "" }));
  };

  const handleProjectSelect = (projectName) => {
    if (projectName === "OTHER") {
      setIsOtherProject(true);
      setFormData(prev => ({ ...prev, project: "" }));
      setProjectInput("");
      setShowSuggestions(false);
    } else {
      setFormData(prev => ({ ...prev, project: projectName }));
      setProjectInput(projectName);
      setShowSuggestions(false);
      setIsOtherProject(false);
    }
  };

  const handlePoNumberInputChange = (e) => {
    setPoNumberInput(e.target.value);
    setFormData(prev => ({ ...prev, poNumber: e.target.value }));
    setIsOtherPoNumber(false);
  };

  const handlePoNumberSelect = (poNumber) => {
    if (poNumber === "OTHER") {
      setIsOtherPoNumber(true);
      setFormData(prev => ({ ...prev, poNumber: "" }));
      setPoNumberInput("");
      setShowPoNumberSuggestions(false);
    } else {
      setFormData(prev => ({ ...prev, poNumber: String(poNumber) }));
      setPoNumberInput(String(poNumber));
      setShowPoNumberSuggestions(false);
      setIsOtherPoNumber(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.project.trim()) {
      newErrors.project = "Project is required";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.deliveryReference.trim()) {
      newErrors.deliveryReference = "Delivery Reference is required";
    }
    if (!formData.requestInfo.trim()) {
      newErrors.requestInfo = "Request Info is required";
    }
    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const logData = {
        ...formData,
        deliveryRef: formData.deliveryReference, // Map to the expected field name
        poNumber: formData.poNumber?.trim() || "",
        type: "Delivery Log",
        createdBy: session?.user?.email,
        createdDate: new Date().toISOString().split('T')[0],
        status: "open",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      // Persist to backend
      const res = await fetch('/api/logs/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      if (!res.ok) throw new Error('Failed to save Delivery Log');
      const savedLog = await res.json();
      handleSaveComplete(savedLog);
      toast.success("Delivery Log created successfully!");
      handleClose();
    } catch (error) {
      toast.error("Failed to create Delivery Log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal
      ? "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      : "app-page w-full max-w-xl mx-auto px-4 py-8"}>
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm w-full max-w-md text-app-text">
        <div className="flex justify-between items-center p-6 border-b border-app-border">
          <h2 className="text-xl font-bold flex items-center gap-2 text-app-text">
            <FiTruck className="text-orange-500" /> New Delivery Log
          </h2>
          <button onClick={handleClose} className="text-app-text-muted hover:text-app-text">
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project field with suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Project *</label>
            <input
              type="text"
              name="project"
              value={isOtherProject ? formData.project : projectInput}
              onChange={handleProjectInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.project ? 'border-red-500' : 'border-app-border'}`}
              required
              autoComplete="off"
              placeholder="Type to search projects (min 2 chars)..."
              onFocus={() => {
                if (projectInput.length >= 2 && projectSuggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {showSuggestions && projectSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-app-surface border border-app-border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {projectSuggestions.map((proj, idx) => (
                  <li
                    key={proj["project-name"] + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-app-surface-muted"
                    onClick={() => handleProjectSelect(proj["project-name"])}
                  >
                    {proj["project-name"]}
                  </li>
                ))}
                <li
                  className="px-3 py-2 cursor-pointer text-app-text-muted hover:bg-app-surface-muted border-t"
                  onClick={() => handleProjectSelect("OTHER")}
                >
                  OTHER (Enter manually)
                </li>
              </ul>
            )}
            {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.title ? 'border-red-500' : 'border-app-border'}`} required />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority *</label>
            <select name="priority" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.priority ? 'border-red-500' : 'border-app-border'}`} required>
              <option value="Info">Info</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Reference *</label>
            <input type="text" name="deliveryReference" value={formData.deliveryReference} onChange={e => setFormData(prev => ({ ...prev, deliveryReference: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.deliveryReference ? 'border-red-500' : 'border-app-border'}`} required />
            {errors.deliveryReference && <p className="mt-1 text-sm text-red-600">{errors.deliveryReference}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              PO Number <span className="text-app-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="poNumber"
              value={isOtherPoNumber ? formData.poNumber : poNumberInput}
              onChange={handlePoNumberInputChange}
              className="w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text border-app-border"
              autoComplete="off"
              placeholder="Type to search PO number (min 3 chars)..."
              onFocus={() => {
                if (poNumberInput.length >= 3 && poNumberSuggestions.length > 0) {
                  setShowPoNumberSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowPoNumberSuggestions(false), 200);
              }}
            />
            {showPoNumberSuggestions && poNumberSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-app-surface border border-app-border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {poNumberSuggestions.map((po, idx) => {
                  const poNum = po["po-number"] ?? po.poNumber ?? "";
                  return (
                    <li
                      key={`${poNum}-${idx}`}
                      className="px-3 py-2 cursor-pointer hover:bg-app-surface-muted"
                      onClick={() => handlePoNumberSelect(poNum)}
                    >
                      {poNum}
                    </li>
                  );
                })}
                <li
                  className="px-3 py-2 cursor-pointer text-app-text-muted hover:bg-app-surface-muted border-t border-app-border"
                  onClick={() => handlePoNumberSelect("OTHER")}
                >
                  OTHER (Enter manually)
                </li>
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Request Info *</label>
            <textarea name="requestInfo" value={formData.requestInfo} onChange={e => setFormData(prev => ({ ...prev, requestInfo: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.requestInfo ? 'border-red-500' : 'border-app-border'}`} rows={3} required />
            {errors.requestInfo && <p className="mt-1 text-sm text-red-600">{errors.requestInfo}</p>}
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-app-border">
            <button type="button" onClick={handleClose} className="px-6 py-2 border rounded-lg text-app-text-secondary hover:bg-app-surface-muted border-app-border">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-app-text rounded-lg font-medium flex items-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSave />} Create Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeliveryForm; 