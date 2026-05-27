import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from "react-toastify";
import useDebounce from '../../../lib/useDebounce';

function PostDeliveryForm({ onClose, onSave }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    project: "",
    title: "",
    priority: "Info",
    poReference: "",
    inspectionReference: "",
    requestInfo: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projectInput, setProjectInput] = useState("");
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [isOtherProject, setIsOtherProject] = useState(false);
  const [poReferenceInput, setPoReferenceInput] = useState("");
  const [poReferenceSuggestions, setPoReferenceSuggestions] = useState([]);
  const [showPoReferenceSuggestions, setShowPoReferenceSuggestions] = useState(false);
  const [isOtherPoReference, setIsOtherPoReference] = useState(false);
  const debouncedProjectInput = useDebounce(projectInput, 400);
  const debouncedPoReferenceInput = useDebounce(poReferenceInput, 400);

  useEffect(() => {
    if (debouncedProjectInput && debouncedProjectInput.length >= 5) {
      fetch(`/api/projects?str=${debouncedProjectInput}`)
        .then(res => res.json())
        .then(data => {
          setProjectSuggestions(data.length ? data : []);
          setShowProjectSuggestions(true);
        });
    } else {
      setProjectSuggestions([]);
      setShowProjectSuggestions(false);
    }
  }, [debouncedProjectInput]);

  useEffect(() => {
    if (debouncedPoReferenceInput && debouncedPoReferenceInput.length >= 3) {
      fetch(`/api/purchaseorders/search?str=${debouncedPoReferenceInput}`)
        .then(res => res.json())
        .then(data => {
          setPoReferenceSuggestions(data.length ? data : []);
          setShowPoReferenceSuggestions(true);
        });
    } else {
      setPoReferenceSuggestions([]);
      setShowPoReferenceSuggestions(false);
    }
  }, [debouncedPoReferenceInput]);

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
    } else {
      setFormData(prev => ({ ...prev, project: projectName }));
      setProjectInput(projectName);
      setShowProjectSuggestions(false);
      setIsOtherProject(false);
    }
  };

  const handlePoReferenceInputChange = (e) => {
    setPoReferenceInput(e.target.value);
    setFormData(prev => ({ ...prev, poReference: e.target.value }));
    setIsOtherPoReference(false);
    if (errors.poReference) setErrors(prev => ({ ...prev, poReference: "" }));
  };

  const handlePoReferenceSelect = (poReference) => {
    if (poReference === "OTHER") {
      setIsOtherPoReference(true);
      setFormData(prev => ({ ...prev, poReference: "" }));
      setPoReferenceInput("");
      setShowPoReferenceSuggestions(false);
    } else {
      setFormData(prev => ({ ...prev, poReference: poReference }));
      setPoReferenceInput(poReference);
      setShowPoReferenceSuggestions(false);
      setIsOtherPoReference(false);
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
    if (!formData.poReference.trim()) {
      newErrors.poReference = "PO Reference is required";
    }
    if (!formData.inspectionReference.trim()) {
      newErrors.inspectionReference = "Inspection Reference is required";
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
        inspectionRef: formData.inspectionReference, // Map to the expected field name
        type: "Post Delivery Log",
        createdBy: session?.user?.email,
        createdDate: new Date().toISOString().split('T')[0],
        status: "open",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      // Persist to backend
      const res = await fetch('/api/logs/postdelivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      if (!res.ok) throw new Error('Failed to save Post Delivery Log');
      const savedLog = await res.json();
      onSave(savedLog);
      toast.success("Post Delivery Log created successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to create Post Delivery Log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <FiCheckCircle className="text-purple-500" /> New Post Delivery Log
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.project ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="off"
              placeholder="Type to search projects..."
              onFocus={() => {
                if (projectInput.length >= 5 && projectSuggestions.length > 0) setShowProjectSuggestions(true);
              }}
            />
            {showProjectSuggestions && projectSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {projectSuggestions.map((proj, idx) => (
                  <li
                    key={proj["project-name"] + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800"
                    onClick={() => handleProjectSelect(proj["project-name"])}
                  >
                    {proj["project-name"]}
                  </li>
                ))}
                <li
                  className="px-3 py-2 cursor-pointer text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-800 border-t"
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
            <input type="text" name="title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority *</label>
            <select name="priority" value={formData.priority} onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.priority ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required>
              <option value="Info">Info</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
          </div>
          {/* PO Reference field with suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">PO Reference *</label>
            <input
              type="text"
              name="poReference"
              value={isOtherPoReference ? formData.poReference : poReferenceInput}
              onChange={handlePoReferenceInputChange}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.poReference ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="off"
              placeholder="Type to search PO references..."
              onFocus={() => {
                if (poReferenceInput.length >= 3 && poReferenceSuggestions.length > 0) setShowPoReferenceSuggestions(true);
              }}
            />
            {showPoReferenceSuggestions && poReferenceSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                {poReferenceSuggestions.map((po, idx) => (
                  <li
                    key={po["po-number"] + idx}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800"
                    onClick={() => handlePoReferenceSelect(po["po-number"])}
                  >
                    {po["po-number"]}
                  </li>
                ))}
                <li
                  className="px-3 py-2 cursor-pointer text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-800 border-t"
                  onClick={() => handlePoReferenceSelect("OTHER")}
                >
                  OTHER (Enter manually)
                </li>
              </ul>
            )}
            {errors.poReference && <p className="mt-1 text-sm text-red-600">{errors.poReference}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Inspection Reference *</label>
            <input type="text" name="inspectionReference" value={formData.inspectionReference} onChange={e => setFormData(prev => ({ ...prev, inspectionReference: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.inspectionReference ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required />
            {errors.inspectionReference && <p className="mt-1 text-sm text-red-600">{errors.inspectionReference}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Request Info *</label>
            <textarea name="requestInfo" value={formData.requestInfo} onChange={e => setFormData(prev => ({ ...prev, requestInfo: e.target.value }))} className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${errors.requestInfo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} rows={3} required />
            {errors.requestInfo && <p className="mt-1 text-sm text-red-600">{errors.requestInfo}</p>}
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSave />} Create Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostDeliveryForm; 