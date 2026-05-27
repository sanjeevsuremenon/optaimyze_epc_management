import React, { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiFile, FiDownload, FiEye } from "react-icons/fi";
import moment from "moment";

function LongLeadPackages() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    packageName: "",
    packageDescription: "",
    dateSharedFromDesigner: "",
    dateSharedToMMDByProject: "",
    dateRFQFloated: "",
    dateOffersSharedWithProject: "",
    poDate: "",
    packageDocuments: [],
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [poSearchTerm, setPoSearchTerm] = useState("");
  const [poSearchResults, setPoSearchResults] = useState([]);
  const [searchingPOs, setSearchingPOs] = useState(false);

  // Fetch projects based on search term
  useEffect(() => {
    const fetchProjects = async () => {
      if (!searchTerm) {
        setProjects([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/projects?str=${searchTerm}`);
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch packages when project is selected
  useEffect(() => {
    const fetchPackages = async () => {
      if (!selectedProject) {
        setPackages([]);
        setSelectedPackage(null);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
        );
        const data = await response.json();
        setPackages(data);
        
        // Update selectedPackage if it exists
        const currentSelectedId = selectedPackage?._id;
        if (currentSelectedId) {
          const updatedPackage = data.find(p => p._id === currentSelectedId);
          if (updatedPackage) {
            setSelectedPackage(updatedPackage);
          } else {
            setSelectedPackage(null);
          }
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
      setLoading(false);
    };

    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSearchTerm(project["project-name"]);
    setProjects([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setFormData({
      packageName: "",
      packageDescription: "",
      dateSharedFromDesigner: "",
      dateSharedToMMDByProject: "",
      dateRFQFloated: "",
      dateOffersSharedWithProject: "",
      poDate: "",
      packageDocuments: [],
    });
    setSelectedFiles([]);
    setShowForm(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      packageName: pkg.packageName || "",
      packageDescription: pkg.packageDescription || "",
      dateSharedFromDesigner: pkg.dateSharedFromDesigner
        ? moment(pkg.dateSharedFromDesigner).format("YYYY-MM-DD")
        : "",
      dateSharedToMMDByProject: pkg.dateSharedToMMDByProject
        ? moment(pkg.dateSharedToMMDByProject).format("YYYY-MM-DD")
        : "",
      dateRFQFloated: pkg.dateRFQFloated
        ? moment(pkg.dateRFQFloated).format("YYYY-MM-DD")
        : "",
      dateOffersSharedWithProject: pkg.dateOffersSharedWithProject
        ? moment(pkg.dateOffersSharedWithProject).format("YYYY-MM-DD")
        : "",
      poDate: pkg.poDate ? moment(pkg.poDate).format("YYYY-MM-DD") : "",
      packageDocuments: pkg.packageDocuments || [],
    });
    setSelectedFiles([]);
    setShowForm(true);
  };

  const handleDelete = async (pkgId) => {
    if (!confirm("Are you sure you want to delete this package?")) {
      return;
    }

    try {
      const response = await fetch(`/api/longleadpackages?_id=${pkgId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh packages list
        const updatedPackages = packages.filter((pkg) => pkg._id !== pkgId);
        setPackages(updatedPackages);
        alert("Package deleted successfully");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      alert("Error deleting package");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    if (!formData.packageName.trim()) {
      alert("Package name is required");
      return;
    }

    try {
      const packageData = {
        projectWbs: selectedProject["project-wbs"],
        projectName: selectedProject["project-name"],
        packageName: formData.packageName,
        packageDescription: formData.packageDescription,
        dateSharedFromDesigner: formData.dateSharedFromDesigner || null,
        dateSharedToMMDByProject: formData.dateSharedToMMDByProject || null,
        dateRFQFloated: formData.dateRFQFloated || null,
        dateOffersSharedWithProject: formData.dateOffersSharedWithProject || null,
        poDate: formData.poDate || null,
        packageDocuments: formData.packageDocuments,
        createdBy: session?.user?.name || session?.user?.email || "Unknown",
        createdByEmail: session?.user?.email || "",
        updatedBy: session?.user?.name || session?.user?.email || "Unknown",
        updatedByEmail: session?.user?.email || "",
      };

        let response;
        if (editingPackage) {
          // Update existing package
          response = await fetch("/api/longleadpackages", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              _id: editingPackage._id,
              ...packageData,
              updatedBy: session?.user?.name || session?.user?.email || "Unknown",
              updatedByEmail: session?.user?.email || "",
            }),
          });
      } else {
        // Create new package
        response = await fetch("/api/longleadpackages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(packageData),
        });
      }

      if (response.ok) {
        const result = await response.json();

        // Upload files if any
        if (selectedFiles.length > 0) {
          await uploadFiles(editingPackage ? editingPackage._id : result._id);
        }

        // Refresh packages list
        const packagesResponse = await fetch(
          `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
        );
        const updatedPackages = await packagesResponse.json();
        setPackages(updatedPackages);

        // Update selectedPackage if it exists
        if (selectedPackage) {
          const updatedPackage = updatedPackages.find(p => p._id === selectedPackage._id);
          if (updatedPackage) {
            setSelectedPackage(updatedPackage);
          }
        }

        setShowForm(false);
        setEditingPackage(null);
        setFormData({
          packageName: "",
          packageDescription: "",
          dateSharedFromDesigner: "",
          dateSharedToMMDByProject: "",
          dateRFQFloated: "",
          dateOffersSharedWithProject: "",
          poDate: "",
          packageDocuments: [],
        });
        setSelectedFiles([]);
        alert(editingPackage ? "Package updated successfully" : "Package created successfully");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving package:", error);
      alert("Error saving package");
    }
  };

  const uploadFiles = async (packageId) => {
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("packageId", packageId);
      formData.append("projectWbs", selectedProject["project-wbs"]);
      formData.append("uploadedBy", session?.user?.name || session?.user?.email || "Unknown");
      formData.append("uploadedByEmail", session?.user?.email || "");

      const response = await fetch("/api/longleadpackages/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      // Refresh packages to get updated document list
      const packagesResponse = await fetch(
        `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
      );
      const updatedPackages = await packagesResponse.json();
      setPackages(updatedPackages);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(`Error uploading files: ${error.message}`);
    } finally {
      setUploadingFiles(false);
      setSelectedFiles([]);
    }
  };

  // Search for POs (filtered by selected project)
  useEffect(() => {
    const searchPOs = async () => {
      if (!selectedProject) {
        setPoSearchResults([]);
        return;
      }
      
      if (!poSearchTerm || poSearchTerm.length < 2) {
        setPoSearchResults([]);
        return;
      }
      
      setSearchingPOs(true);
      try {
        const projectWbs = selectedProject["project-wbs"];
        const response = await fetch(
          `/api/purchaseorders/search-unique?str=${poSearchTerm}&projectWbs=${encodeURIComponent(projectWbs)}`
        );
        const data = await response.json();
        setPoSearchResults(data);
      } catch (error) {
        console.error("Error searching POs:", error);
      }
      setSearchingPOs(false);
    };

    const debounceTimer = setTimeout(searchPOs, 300);
    return () => clearTimeout(debounceTimer);
  }, [poSearchTerm, selectedProject]);

  const handleAssignPO = async (poNumber) => {
    if (!selectedPackage) return;

    const currentAssignments = selectedPackage.poAssignments || [];
    if (currentAssignments.some(a => a.poNumber === poNumber)) {
      alert("This PO is already assigned to this package");
      return;
    }

    try {
      const response = await fetch("/api/longleadpackages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: selectedPackage._id,
          updatedBy: session?.user?.name || session?.user?.email || "Unknown",
          updatedByEmail: session?.user?.email || "",
          poAssignmentMetadata: {
            poNumber: poNumber,
            assignedBy: session?.user?.name || session?.user?.email || "Unknown",
            assignedByEmail: session?.user?.email || "",
            assignedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        // Refresh packages list
        const packagesResponse = await fetch(
          `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
        );
        const updatedPackages = await packagesResponse.json();
        setPackages(updatedPackages);
        
        // Update selected package
        const updatedPackage = updatedPackages.find(p => p._id === selectedPackage._id);
        setSelectedPackage(updatedPackage);
        
        setPoSearchTerm("");
        setPoSearchResults([]);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error assigning PO:", error);
      alert("Error assigning PO");
    }
  };

  const handleUnassignPO = async (poNumber) => {
    if (!selectedPackage) return;

    if (!confirm("Are you sure you want to unassign this PO from the package?")) {
      return;
    }

    try {
      const currentAssignments = selectedPackage.poAssignments || [];
      const updatedAssignments = currentAssignments.filter(a => a.poNumber !== poNumber);
      const updatedPONumbers = updatedAssignments.map(a => a.poNumber);
      
      const response = await fetch("/api/longleadpackages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: selectedPackage._id,
          poNumbers: updatedPONumbers, // Pass poNumbers to sync assignments
          updatedBy: session?.user?.name || session?.user?.email || "Unknown",
          updatedByEmail: session?.user?.email || "",
        }),
      });

      if (response.ok) {
        // Refresh packages list
        const packagesResponse = await fetch(
          `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
        );
        const updatedPackages = await packagesResponse.json();
        setPackages(updatedPackages);
        
        // Update selected package
        const updatedPackage = updatedPackages.find(p => p._id === selectedPackage._id);
        setSelectedPackage(updatedPackage);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error unassigning PO:", error);
      alert("Error unassigning PO");
    }
  };

  const handleRemoveDocument = async (packageId, documentIndex) => {
    if (!confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      const pkg = packages.find((p) => p._id === packageId);
      if (!pkg) return;

      const updatedDocuments = pkg.packageDocuments.filter(
        (_, index) => index !== documentIndex
      );

      const response = await fetch("/api/longleadpackages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: packageId,
          packageDocuments: updatedDocuments,
        }),
      });

      if (response.ok) {
        // Refresh packages list
        const packagesResponse = await fetch(
          `/api/longleadpackages?projectWbs=${encodeURIComponent(selectedProject["project-wbs"])}`
        );
        const updatedPackages = await packagesResponse.json();
        setPackages(updatedPackages);
      }
    } catch (error) {
      console.error("Error removing document:", error);
      alert("Error removing document");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Long Lead Material Packages
        </h1>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects by name..."
              className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Project Suggestions */}
          {projects.length > 0 && (
            <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto z-50">
              {projects.map((project, index) => (
                <div
                  key={index}
                  onClick={() => handleProjectSelect(project)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">
                    {project["project-name"]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {project["project-wbs"]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Project Display */}
        {selectedProject && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedProject["project-name"]}
                </h2>
                <p className="text-sm text-gray-600">
                  WBS: {selectedProject["project-wbs"]}
                </p>
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FiPlus className="mr-2" />
                Add New Package
              </button>
            </div>
          </div>
        )}

        {/* Packages List */}
        {selectedProject && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Packages</h2>
                <p className="text-sm text-gray-600 italic">
                  Note: Uploaded documents can be viewed/downloaded by clicking the edit button
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : packages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FiFile className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No Packages Found
                </h3>
                <p className="text-gray-500">
                  Click "Add New Package" to create the first package for this project.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Package Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date Shared from Designer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date Shared to MMD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        PO Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages.map((pkg) => (
                      <tr 
                        key={pkg._id} 
                        onClick={() => setSelectedPackage(pkg)}
                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                          selectedPackage?._id === pkg._id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pkg.packageName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {pkg.packageDescription}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pkg.dateSharedFromDesigner
                            ? moment(pkg.dateSharedFromDesigner).format("MM/DD/YYYY")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pkg.dateSharedToMMDByProject
                            ? moment(pkg.dateSharedToMMDByProject).format("MM/DD/YYYY")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {pkg.poDate
                            ? moment(pkg.poDate).format("MM/DD/YYYY")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pkg.packageDocuments?.length || 0} file(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(pkg);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit package"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(pkg._id);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete package"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PO Assignment Section */}
        {selectedPackage && (
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Purchase Orders - {selectedPackage.packageName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Click on a package row above to view and assign POs
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPackage(null);
                    setPoSearchTerm("");
                    setPoSearchResults([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Assigned POs */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Assigned Purchase Orders ({selectedPackage.poAssignments?.length || 0})
                </h3>
                {selectedPackage.poAssignments && selectedPackage.poAssignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPackage.poAssignments.map((assignment, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{assignment.poNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Assigned by: {assignment.assignedBy}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.assignedAt ? moment(assignment.assignedAt).format("MM/DD/YYYY HH:mm") : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUnassignPO(assignment.poNumber)}
                            className="ml-2 text-red-600 hover:text-red-800"
                            title="Unassign PO"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No POs assigned to this package yet.</p>
                    <p className="text-sm mt-2">Search and assign POs below.</p>
                  </div>
                )}
              </div>

              {/* Search and Assign POs */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Search and Assign Purchase Orders
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Only POs for project <span className="font-semibold">{selectedProject["project-name"]}</span> ({selectedProject["project-wbs"]}) will be shown
                </p>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search POs by PO number..."
                    className="w-full px-4 py-3 pl-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm"
                    value={poSearchTerm}
                    onChange={(e) => setPoSearchTerm(e.target.value)}
                  />
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Search Results */}
                {poSearchTerm.length >= 2 && (
                  <div className="mt-4">
                    {searchingPOs ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : poSearchResults.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                PO Number
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Vendor
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Value (SAR)
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {poSearchResults.map((po, index) => {
                              const isAssigned = selectedPackage.poAssignments?.some(
                                a => a.poNumber === po["po-number"]
                              );
                              return (
                                <tr
                                  key={index}
                                  className={`hover:bg-blue-50 ${
                                    isAssigned ? "bg-green-50" : ""
                                  }`}
                                >
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {po["po-number"]}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {po["po-date"]
                                      ? moment(po["po-date"]).format("MM/DD/YYYY")
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div>
                                      <div className="font-medium">{po.vendorcode || "-"}</div>
                                      <div className="text-xs text-gray-500">
                                        {po.vendorname || "-"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {po.poval ? po.poval.toLocaleString() : "0"}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {isAssigned ? (
                                      <span className="text-green-600 font-medium">Assigned</span>
                                    ) : (
                                      <button
                                        onClick={() => handleAssignPO(po["po-number"])}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Assign
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No POs found matching "{poSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Package Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingPackage ? "Edit Package" : "Add New Package"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingPackage(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      name="packageName"
                      value={formData.packageName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Shared from Designer
                    </label>
                    <input
                      type="date"
                      name="dateSharedFromDesigner"
                      value={formData.dateSharedFromDesigner}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Description
                    </label>
                    <textarea
                      name="packageDescription"
                      value={formData.packageDescription}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Shared to MMD by Project
                    </label>
                    <input
                      type="date"
                      name="dateSharedToMMDByProject"
                      value={formData.dateSharedToMMDByProject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date RFQ Floated
                    </label>
                    <input
                      type="date"
                      name="dateRFQFloated"
                      value={formData.dateRFQFloated}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Offers Shared with Project
                    </label>
                    <input
                      type="date"
                      name="dateOffersSharedWithProject"
                      value={formData.dateOffersSharedWithProject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PO Date
                    </label>
                    <input
                      type="date"
                      name="poDate"
                      value={formData.poDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Documents
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {selectedFiles.length} file(s) selected
                      </div>
                    )}
                    {editingPackage && formData.packageDocuments?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Existing Documents:
                        </p>
                        <div className="space-y-2">
                          {formData.packageDocuments.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <FiFile className="mr-2 text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate" title={doc.originalName}>
                                  {doc.originalName}
                                </span>
                                {doc.fileSize && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({(doc.fileSize / 1024).toFixed(2)} KB)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  type="button"
                                  onClick={() => window.open(doc.filePath, '_blank')}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="View document"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.filePath;
                                    link.download = doc.originalName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-200"
                                  title="Download document"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveDocument(editingPackage._id, index)
                                  }
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Remove document"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPackage(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingFiles}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingFiles
                      ? "Uploading..."
                      : editingPackage
                      ? "Update Package"
                      : "Create Package"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>    </div>
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

export default LongLeadPackages;
