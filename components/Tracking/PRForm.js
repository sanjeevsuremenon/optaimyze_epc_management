import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FiSave, FiX, FiFileText } from 'react-icons/fi';
import { toast } from "react-toastify";
import useDebounce from '../../lib/useDebounce';

function PRForm({ onClose, onSave }) {
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
    prNumber: "",
    requestInfo: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectInput, setProjectInput] = useState("");
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [isOtherProject, setIsOtherProject] = useState(false);
  const [prNumberInput, setPrNumberInput] = useState("");
  const [prNumberSuggestions, setPrNumberSuggestions] = useState([]);
  const [showPrNumberSuggestions, setShowPrNumberSuggestions] = useState(false);
  const [isOtherPrNumber, setIsOtherPrNumber] = useState(false);
  const debouncedProjectInput = useDebounce(projectInput, 400);
  const debouncedPrNumberInput = useDebounce(prNumberInput, 400);

  useEffect(() => {
    if (debouncedProjectInput && debouncedProjectInput.length >= 2) {
      fetch(`/api/projects?str=${debouncedProjectInput}`)
        .then(res => res.json())
        .then(data => {
          setProjectSuggestions(Array.isArray(data) && data.length ? data : []);
          setShowProjectSuggestions(true);
        });
    } else {
      setProjectSuggestions([]);
      setShowProjectSuggestions(false);
    }
  }, [debouncedProjectInput]);

  useEffect(() => {
    if (debouncedPrNumberInput && debouncedPrNumberInput.length >= 3) {
      fetch(`/api/openrequisitions/search?str=${debouncedPrNumberInput}`)
        .then(res => res.json())
        .then(data => {
          setPrNumberSuggestions(Array.isArray(data) && data.length ? data : []);
          setShowPrNumberSuggestions(true);
        });
    } else {
      setPrNumberSuggestions([]);
      setShowPrNumberSuggestions(false);
    }
  }, [debouncedPrNumberInput]);

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
      setShowProjectSuggestions(false);
      setProjectSuggestions([]);
    } else {
      setFormData(prev => ({ ...prev, project: projectName }));
      setProjectInput(projectName);
      setShowProjectSuggestions(false);
      setProjectSuggestions([]);
      setIsOtherProject(false);
      // Focus on next field (Title)
      document.querySelector('input[name="title"]')?.focus();
    }
  };

  const handlePrNumberInputChange = (e) => {
    setPrNumberInput(e.target.value);
    setFormData(prev => ({ ...prev, prNumber: e.target.value }));
    setIsOtherPrNumber(false);
    if (errors.prNumber) setErrors(prev => ({ ...prev, prNumber: "" }));
  };

  const handlePrNumberSelect = (prNumber) => {
    if (prNumber === "OTHER") {
      setIsOtherPrNumber(true);
      setFormData(prev => ({ ...prev, prNumber: "" }));
      setPrNumberInput("");
      setShowPrNumberSuggestions(false);
      setPrNumberSuggestions([]);
    } else {
      setFormData(prev => ({ ...prev, prNumber: prNumber }));
      setPrNumberInput(prNumber);
      setShowPrNumberSuggestions(false);
      setPrNumberSuggestions([]);
      setIsOtherPrNumber(false);
      // Focus on next field (Request Info)
      document.querySelector('textarea[name="requestInfo"]')?.focus();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
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
    if (!formData.prNumber.trim()) {
      newErrors.prNumber = "PR Number is required";
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
        type: "PR Log",
        createdBy: session?.user?.email,
        createdDate: new Date().toISOString().split('T')[0],
        status: "open",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      // Persist to backend
      const res = await fetch('/api/logs/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      if (!res.ok) throw new Error('Failed to save PR Log');
      const savedLog = await res.json();
      handleSaveComplete(savedLog);
      toast.success("PR Log created successfully!");
      handleClose();
    } catch (error) {
      toast.error("Failed to create PR Log");
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
            <FiFileText className="text-blue-500" /> New PR Log
          </h2>
          <button onClick={handleClose} className="text-app-text-muted hover:text-app-text">
            <FiX size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                if (projectInput.length >= 2 && projectSuggestions.length > 0) setShowProjectSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowProjectSuggestions(false);
                }, 200);
              }}
            />
            {showProjectSuggestions && projectSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-app-surface border border-app-border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {projectSuggestions.map((proj, idx) => (
                  <li
                    key={proj["project-name"] + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-app-surface-muted"
                    onMouseDown={() => handleProjectSelect(proj["project-name"])}
                  >
                    {proj["project-name"]}
                  </li>
                ))}
                <li
                  className="px-3 py-2 cursor-pointer text-app-text-muted hover:bg-app-surface-muted border-t"
                  onMouseDown={() => handleProjectSelect("OTHER")}
                >
                  OTHER (Enter manually)
                </li>
              </ul>
            )}
            {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.title ? 'border-red-500' : 'border-app-border'}`} required />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority *</label>
            <select name="priority" value={formData.priority} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.priority ? 'border-red-500' : 'border-app-border'}`} required>
              <option value="Info">Info</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-2">PR Number *</label>
            <input
              type="text"
              name="prNumber"
              value={isOtherPrNumber ? formData.prNumber : prNumberInput}
              onChange={handlePrNumberInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.prNumber ? 'border-red-500' : 'border-app-border'}`}
              required
              autoComplete="off"
              placeholder="Type to search PR numbers..."
              onFocus={() => {
                if (prNumberInput.length >= 3 && prNumberSuggestions.length > 0) setShowPrNumberSuggestions(true);
              }}
              onBlur={() => {
                // Hide suggestions when input loses focus (with a small delay to allow for clicks)
                setTimeout(() => {
                  setShowPrNumberSuggestions(false);
                }, 200);
              }}
            />
            {showPrNumberSuggestions && prNumberSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-app-surface border border-app-border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {prNumberSuggestions.map((pr, idx) => (
                  <li
                    key={pr["pr-number"] + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-app-surface-muted"
                    onClick={() => handlePrNumberSelect(pr["pr-number"])}
                  >
                    {pr["pr-number"]}
                  </li>
                ))}
                <li
                  className="px-3 py-2 cursor-pointer text-app-text-muted hover:bg-app-surface-muted border-t"
                  onClick={() => handlePrNumberSelect("OTHER")}
                >
                  OTHER (Enter manually)
                </li>
              </ul>
            )}
            {errors.prNumber && <p className="mt-1 text-sm text-red-600">{errors.prNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Request Info *</label>
            <textarea name="requestInfo" value={formData.requestInfo} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg bg-app-bg text-app-text ${errors.requestInfo ? 'border-red-500' : 'border-app-border'}`} rows={3} required />
            {errors.requestInfo && <p className="mt-1 text-sm text-red-600">{errors.requestInfo}</p>}
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-app-border">
            <button type="button" onClick={handleClose} className="px-6 py-2 border rounded-lg text-app-text-secondary hover:bg-app-surface-muted border-app-border">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSave />} Create Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PRForm; 