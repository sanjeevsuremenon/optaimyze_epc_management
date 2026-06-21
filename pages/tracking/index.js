import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { 
  FiPlus, 
  FiEye, 
  FiEyeOff, 
  FiFilter, 
  FiSearch, 
  FiCalendar,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiTruck,
  FiPackage,
  FiFileText,
  FiShoppingCart
} from 'react-icons/fi';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PRForm from "./forms/PRForm";
import POForm from "./forms/POForm";
import DeliveryForm from "./forms/DeliveryForm";
import PostDeliveryForm from "./forms/PostDeliveryForm";

function TrackingPage() {
  const { data: session } = useSession();
  const [trackings, setTrackings] = useState([]);
  const [filteredTrackings, setFilteredTrackings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "open", "closed", "all"
  const [selectedLogType, setSelectedLogType] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [logScope, setLogScope] = useState("all logs"); // "my logs" or "all logs"
  const [showNewTrackingModal, setShowNewTrackingModal] = useState(false);
  const [selectedTrackingType, setSelectedTrackingType] = useState("");

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setTrackings(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = [...trackings];

    // Filter by log scope (my logs vs all logs)
    if (logScope === "my logs" && session?.user?.email) {
      filtered = filtered.filter(tracking => tracking.createdBy === session.user.email);
    }

    // Filter by view mode
    if (viewMode === "open") {
      filtered = filtered.filter(tracking => tracking.status === "open");
    } else if (viewMode === "closed") {
      filtered = filtered.filter(tracking => tracking.status === "closed");
    }
    // "all" shows everything

    // Filter by log type
    if (selectedLogType !== "All") {
      filtered = filtered.filter(tracking => tracking.type === selectedLogType);
    }

    // Filter by priority
    if (selectedPriority !== "All") {
      filtered = filtered.filter(tracking => tracking.priority === selectedPriority);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tracking =>
        tracking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tracking.requestInfo ? tracking.requestInfo.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        tracking.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracking.project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort: open logs first (most recent), then closed logs (most recent)
    filtered.sort((a, b) => {
      // First sort by status (open first)
      if (a.status !== b.status) {
        return a.status === "open" ? -1 : 1;
      }
      // Then sort by created date (most recent first)
      return new Date(b.createdDate) - new Date(a.createdDate);
    });

    setFilteredTrackings(filtered);
  }, [trackings, viewMode, searchTerm, selectedLogType, selectedPriority, logScope, session?.user?.email]);

  const getTrackingTypeIcon = (type) => {
    switch (type) {
      case "open PR":
        return <FiFileText className="text-blue-600" />;
      case "open PO":
        return <FiShoppingCart className="text-green-600" />;
      case "open delivery":
        return <FiTruck className="text-orange-600" />;
      case "post delivery":
        return <FiPackage className="text-purple-600" />;
      default:
        return <FiAlertCircle className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    // Convert to lowercase for case-insensitive comparison
    const priorityLower = priority ? priority.toLowerCase() : '';
    
    switch (priorityLower) {
      case "high":
        return "bg-red-50 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-50 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-50 text-green-800 border-green-300";
      case "info":
        return "bg-blue-50 text-blue-800 border-blue-300";
      default:
        console.log("Unknown priority:", priority, "using default gray");
        return "bg-gray-50 text-gray-800 border-gray-300";
    }
  };

  const getLogTypeBackground = (type, status) => {
    if (status === "open") {
      return "bg-gradient-to-br from-white to-stone-100 border-stone-200";
    } else {
      return "bg-gradient-to-br from-zinc-50 to-zinc-300 border-zinc-200";
    }
  };

  const getStatusIcon = (status) => {
    return status === "open" ? 
      <FiClock className="text-orange-600" /> : 
      <FiCheckCircle className="text-green-600" />;
  };

  const handleNewTracking = () => {
    setShowNewTrackingModal(true);
  };

  const handleCloseModal = () => {
    setShowNewTrackingModal(false);
    setSelectedTrackingType("");
  };

  const handleTrackingTypeSelect = (type) => {
    setSelectedTrackingType(type);
    // Here you would typically navigate to the specific form
    console.log("Selected tracking type:", type);
    toast.info(`Creating new ${type} tracking...`);
    handleCloseModal();
  };

  const canCloseTracking = (tracking) => {
    return session?.user?.email === tracking.createdBy || 
           session?.user?.email === "suresh.n@jalint.com.sa";
  };

  const handleCloseTracking = async (trackingId) => {
    try {
      // Find the tracking to determine its type and collection
      const tracking = trackings.find(t => t.id === trackingId);
      if (!tracking) {
        toast.error('Tracking not found');
        return;
      }

      // Determine which API endpoint to use based on tracking type
      let endpoint = '';
      switch (tracking.type) {
        case 'open PR':
          endpoint = '/api/logs/pr';
          break;
        case 'open PO':
          endpoint = '/api/logs/po';
          break;
        case 'open delivery':
          endpoint = '/api/logs/delivery';
          break;
        case 'post delivery':
          endpoint = '/api/logs/postdelivery';
          break;
        default:
          toast.error('Invalid tracking type');
          return;
      }

      // Update the tracking status
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: trackingId,
          status: 'closed',
          lastUpdated: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close tracking');
      }

      // Update local state
      setTrackings(prev => prev.map(t => 
        t.id === trackingId 
          ? { ...t, status: "closed", lastUpdated: new Date().toISOString().split('T')[0] }
          : t
      ));
      
      toast.success("Log closed successfully!");
    } catch (error) {
      console.error('Error closing tracking:', error);
      toast.error('Failed to close log');
    }
  };

  // Add new tracking to the list
  const handleSaveTracking = async (newTracking) => {
    try {
      // If the tracking already has an _id, it means it was created by the form's API call
      if (newTracking._id) {
        // Transform the tracking to match our expected format
        const transformedTracking = {
          ...newTracking,
          id: newTracking._id.toString(),
          type: newTracking.type === 'PR Log' ? 'open PR' :
                newTracking.type === 'PO Log' ? 'open PO' :
                newTracking.type === 'Delivery Log' ? 'open delivery' :
                newTracking.type === 'Post Delivery Log' ? 'post delivery' : newTracking.type
        };
        
        // Add to local state
        setTrackings((prev) => [transformedTracking, ...prev]);
        return;
      }

      // If no _id, the form didn't make the API call, so we need to do it here
      let endpoint = '';
      let mappedType = '';
      
      switch (newTracking.type) {
        case 'PR Log':
          endpoint = '/api/logs/pr';
          mappedType = 'open PR';
          break;
        case 'PO Log':
          endpoint = '/api/logs/po';
          mappedType = 'open PO';
          break;
        case 'Delivery Log':
          endpoint = '/api/logs/delivery';
          mappedType = 'open delivery';
          break;
        case 'Post Delivery Log':
          endpoint = '/api/logs/postdelivery';
          mappedType = 'post delivery';
          break;
        default:
          toast.error('Invalid tracking type');
          return;
      }

      // Create the tracking via API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTracking,
          type: mappedType, // Use the mapped type for consistency
          createdBy: session?.user?.email,
          createdDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'open'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tracking');
      }

      const createdTracking = await response.json();
      
      // Add to local state with correct type mapping
      setTrackings((prev) => [
        { 
          ...createdTracking, 
          id: createdTracking._id.toString(),
          type: mappedType // Ensure the correct type is set for URL generation
        },
        ...prev
      ]);
      
      toast.success('Log created successfully!');
    } catch (error) {
      console.error('Error creating tracking:', error);
      toast.error('Failed to create log');
    }
  };

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="bg-light-primary dark:bg-dark-primary min-h-screen flex items-center justify-center">
        <Head>
          <title>Access Denied - OPTAIMYZE Portal</title>
        </Head>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-app-text mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access the tracking page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-primary dark:bg-dark-primary min-h-screen">
      <Head>
        <title> Tracking Log - OPTAIMYZE Portal</title>
        <meta name="description" content="Purchase requisition and purchase order tracking" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-app-text mb-2">
            Purchase Tracking Log
          </h1>
          <p className="text-gray-600 italic text-sm dark:text-gray-400">
            Track purchase requisitions, purchase orders, deliveries, and post-delivery activities
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white dark:bg-gray-800 text-xs rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Log Scope Dropdown */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={logScope}
                  onChange={(e) => setLogScope(e.target.value)}
                  className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-app-text"
                >
                  <option value="all logs">All Logs</option>
                  <option value="my logs">My Logs</option>
                </select>
              </div>

              {/* Log Type Dropdown */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedLogType}
                  onChange={(e) => setSelectedLogType(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-app-text"
                >
                  <option value="All">All Log Types</option>
                  <option value="open PR">Open PR</option>
                  <option value="open PO">Open PO</option>
                  <option value="open delivery">Open Delivery</option>
                  <option value="post delivery">Post Delivery</option>
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-app-text"
                >
                  <option value="All">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trackings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-app-text"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("open")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === "open"
                      ? "bg-grey-500 text-app-text"
                      : "bg-teal-100 text-gray-700 dark:bg-gray-700 dark:text-app-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FiEye className="inline mr-2" />
                  Open Logs
                </button>
                
                <button
                  onClick={() => setViewMode("closed")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === "closed"
                      ? "bg-grey-500 text-app-text"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-app-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FiEyeOff className="inline mr-2" />
                  Closed Logs
                </button>
                
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === "all"
                      ? "bg-gray-500 text-app-text"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-app-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FiFilter className="inline mr-2" />
                  All Logs
                </button>
              </div>
            </div>

            {/* New Tracking Button */}
            <button
              onClick={handleNewTracking}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FiPlus />
              New Log
            </button>
          </div>
        </div>

        {/* Tracking List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Loading trackings...</p>
            </div>
          ) : filteredTrackings.length === 0 ? (
            <div className="p-8 text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-app-text">No trackings found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? "Try adjusting your search terms." : "Get started by creating a new tracking."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid gap-3 p-4">
                {filteredTrackings.map((tracking) => (
                  <div
                    key={tracking.id}
                    className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${getLogTypeBackground(tracking.type, tracking.status)} ${
                      tracking.status === "open" ? "self-start" : "self-end"
                    }`}
                    style={{
                      width: "80%",
                      marginLeft: tracking.status === "open" ? "0" : "auto",
                      marginRight: tracking.status === "closed" ? "0" : "auto"
                    }}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ width: "60%" }}>
                      {/* Left Section - Badges, Buttons, Metadata */}
                      <div className="flex flex-col gap-2 lg:w-1/3 lg:border-r lg:border-gray-200 lg:pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getTrackingTypeIcon(tracking.type)}
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {tracking.type ? tracking.type.toUpperCase() : ""}
                          </span>
                          {getStatusIcon(tracking.status)}
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(tracking.priority)}`}>
                            {tracking.priority}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FiUser className="text-gray-500 " />
                            <span className="font-bold text-gray-500 dark:text-gray-400 text-[10px]">Created by: {tracking.createdBy}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-gray-500" />
                            <span>Created: {tracking.createdDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiClock className="text-gray-500" />
                            <span>Updated: {tracking.lastUpdated}</span>
                          </div>
                          {tracking.assignedTo && (
                            <div className="flex items-center gap-1">
                              <FiUser className="text-gray-500" />
                              <span>Assigned to: {tracking.assignedTo}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {tracking.status === "open" && canCloseTracking(tracking) && (
                            <button
                              onClick={() => handleCloseTracking(tracking.id)}
                              className="bg-green-600 hover:bg-green-700 w-1/2 text-white px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <FiCheckCircle />
                              Close Log
                            </button>
                          )}
                          
                          {/* View Details Button */}
                          <button
                            className="bg-blue-600 hover:bg-blue-700 w-1/2 text-white px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                            onClick={() => {
                              // The type for the URL is inferred from the collection, not stored in MongoDB
                              if (!tracking.type) {
                                console.warn('Missing type for tracking:', tracking);
                                toast.error('Cannot view details: Log type is missing');
                                return;
                              }
                              const type = (tracking.type || '')
                                .replace('open PR', 'pr')
                                .replace('open PO', 'po')
                                .replace('open delivery', 'delivery')
                                .replace('post delivery', 'postdelivery');
                              
                              // Validate that we have a valid type
                              if (!type || type === tracking.type) {
                                console.warn('Invalid or unrecognized type:', tracking.type);
                                toast.error('Cannot view details: Invalid log type');
                                return;
                              }
                              
                              const url = `/tracking/${type}/${tracking.id}`;
                              console.log('Navigating to:', url);
                              window.location.href = url;
                            }}
                          >
                            <FiEye />
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Right Section - Content */}
                      <div className="flex-1 lg:w-2/3 lg:pl-4">
                        {/* Project Name - Prominent at top */}
                        {tracking.project && (
                          <div className="mb-3">
                            <h2 className="text-[12px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                              {tracking.project}
                            </h2>
                          </div>
                        )}
                        
                        {/* Title - Top right */}
                        <div className="mb-3">
                          
                          <h3 className="text-base font-semibold text-gray-900 dark:text-app-text text-left">
                            {tracking.title}
                          </h3>
                        </div>
                        
                        {/* Description - Full width */}
                        <p className="text-sm text-gray-700 dark:text-app-text-secondary leading-relaxed">
                          {tracking.requestInfo}
                        </p>
                        
                        {/* Project Name in content area
                        {tracking.project && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Project:</span> {tracking.project}
                            </p>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Tracking Modal */}
      {showNewTrackingModal && (
        <>
          {/* Show the correct form based on selectedTrackingType */}
          {selectedTrackingType === "open PR" && (
            <PRForm onClose={() => { setShowNewTrackingModal(false); setSelectedTrackingType(""); }} onSave={handleSaveTracking} />
          )}
          {selectedTrackingType === "open PO" && (
            <POForm onClose={() => { setShowNewTrackingModal(false); setSelectedTrackingType(""); }} onSave={handleSaveTracking} />
          )}
          {selectedTrackingType === "open delivery" && (
            <DeliveryForm onClose={() => { setShowNewTrackingModal(false); setSelectedTrackingType(""); }} onSave={handleSaveTracking} />
          )}
          {selectedTrackingType === "post delivery" && (
            <PostDeliveryForm onClose={() => { setShowNewTrackingModal(false); setSelectedTrackingType(""); }} onSave={handleSaveTracking} />
          )}

          {/* If no type selected, show the type selection modal */}
          {!selectedTrackingType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-app-text">
                    Create New Log
                  </h2>
                  <button
                    onClick={() => setShowNewTrackingModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-app-text-secondary"
                  >
                    <FiXCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select the type of tracking you want to create:
                  </p>

                  {[
                    { type: "open PR", icon: FiFileText, color: "blue", description: "Purchase Requisition tracking" },
                    { type: "open PO", icon: FiShoppingCart, color: "green", description: "Purchase Order tracking" },
                    { type: "open delivery", icon: FiTruck, color: "orange", description: "Delivery tracking" },
                    { type: "post delivery", icon: FiPackage, color: "purple", description: "Post-delivery activities" }
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setSelectedTrackingType(option.type)}
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`text-${option.color}-500`} size={20} />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-app-text">
                              {option.type}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default TrackingPage; 