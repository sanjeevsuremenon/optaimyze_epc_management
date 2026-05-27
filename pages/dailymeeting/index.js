import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPlus, FiList, FiGrid, FiEdit2, FiTrash2, FiCheck, FiX, FiCalendar, FiUser, FiFileText, FiSearch, FiArrowUp, FiArrowDown, FiFilter, FiFolder } from "react-icons/fi";
import moment from "moment";

export default function DailyMeeting() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [closedTasks, setClosedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "card"
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showClosedTasks, setShowClosedTasks] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date());
  const [project, setProject] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [projectSearchLoading, setProjectSearchLoading] = useState(false);
  const [projectSortConfig, setProjectSortConfig] = useState({
    key: 'project-name',
    direction: 'asc'
  });
  const [selectdown, setSelectdown] = useState("open PO");
  const [discussionPoint, setDiscussionPoint] = useState("");
  const [actionBy, setActionBy] = useState("");
  const [closeFlag, setCloseFlag] = useState(false);
  
  // Follow-up comment states
  const [showFollowUpInput, setShowFollowUpInput] = useState({});
  const [followUpText, setFollowUpText] = useState({});

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch project suggestions - same logic as /projects1
  useEffect(() => {
    const fetchProjects = async () => {
      if (!projectInput) {
        setProjectSuggestions([]);
        setShowProjectSuggestions(false);
        setProjectSearchLoading(false);
        return;
      }
      setProjectSearchLoading(true);
      setShowProjectSuggestions(true);
      try {
        const response = await fetch(`/api/projects?str=${projectInput}`);
        const data = await response.json();
        setProjectSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjectSuggestions([]);
      } finally {
        setProjectSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounceTimer);
  }, [projectInput]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dailymeetings");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchClosedTasks = async () => {
    try {
      const response = await fetch("/api/dailymeetings/closed");
      const data = await response.json();
      setClosedTasks(data);
    } catch (error) {
      console.error("Error fetching closed tasks:", error);
      toast.error("Failed to fetch closed tasks");
    }
  };

  const handleProjectInputChange = (e) => {
    const value = e.target.value;
    setProjectInput(value);
    // Clear selected project when user starts typing a new search
    if (project && value !== project) {
      setProject("");
    }
    if (!value) {
      setProject("");
      setShowProjectSuggestions(false);
      setProjectSuggestions([]);
    }
  };

  const handleProjectSelect = (projectItem) => {
    const projectName = projectItem["project-name"];
    setProject(projectName);
    setProjectInput(projectName);
    setShowProjectSuggestions(false);
  };

  // Sort projects
  const sortedProjectSuggestions = React.useMemo(() => {
    let sortableItems = [...projectSuggestions];
    if (projectSortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[projectSortConfig.key] || '';
        const bVal = b[projectSortConfig.key] || '';
        if (aVal < bVal) {
          return projectSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return projectSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projectSuggestions, projectSortConfig]);

  const requestProjectSort = (key) => {
    let direction = 'asc';
    if (projectSortConfig.key === key && projectSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setProjectSortConfig({ key, direction });
  };

  const ProjectSortIndicator = ({ columnKey }) => {
    if (projectSortConfig.key !== columnKey) return null;
    return projectSortConfig.direction === 'asc' ? 
      <FiArrowUp className="inline ml-1" /> : 
      <FiArrowDown className="inline ml-1" />;
  };

  const resetForm = () => {
    setDate(new Date());
    setProject("");
    setProjectInput("");
    setSelectdown("open PO");
    setDiscussionPoint("");
    setActionBy("");
    setCloseFlag(false);
    setEditingTask(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!project || !discussionPoint || !actionBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        date: date.toISOString().split("T")[0],
        project,
        selectdown,
        discussionPoint,
        actionBy,
        closeFlag,
      };

      let response;
      if (editingTask) {
        // Update existing task
        response = await fetch("/api/dailymeetings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            _id: editingTask._id, 
            ...taskData,
            updatedBy: session?.user?.email || 'Unknown'
          }),
        });
      } else {
        // Create new task
        response = await fetch("/api/dailymeetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
      }

      if (!response.ok) throw new Error("Failed to save task");

      toast.success(editingTask ? "Task updated successfully" : "Task created successfully");
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setDate(new Date(task.date));
    setProject(task.project);
    setProjectInput(task.project);
    setSelectdown(task.selectdown);
    setDiscussionPoint(task.discussionPoint);
    setActionBy(task.actionBy);
    setCloseFlag(task.closeFlag || false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch("/api/dailymeetings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: taskId }),
      });

      if (!response.ok) throw new Error("Failed to delete task");

      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleCloseTask = async (task) => {
    try {
      const response = await fetch("/api/dailymeetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: task._id, closeFlag: true }),
      });

      if (!response.ok) throw new Error("Failed to close task");

      toast.success("Task closed successfully");
      fetchTasks();
      if (showClosedTasks) {
        fetchClosedTasks();
      }
    } catch (error) {
      console.error("Error closing task:", error);
      toast.error("Failed to close task");
    }
  };

  const handleAddFollowUp = async (taskId, field) => {
    const text = followUpText[`${taskId}-${field}`]?.trim();
    if (!text) {
      toast.error("Please enter a follow-up comment");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dailymeetings/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          field,
          newText: text,
          updatedBy: session?.user?.email || session?.user?.name || 'Unknown'
        }),
      });

      if (!response.ok) throw new Error("Failed to add follow-up comment");

      toast.success("Follow-up comment added successfully");
      setFollowUpText({ ...followUpText, [`${taskId}-${field}`]: "" });
      setShowFollowUpInput({ ...showFollowUpInput, [`${taskId}-${field}`]: false });
      fetchTasks();
      if (showClosedTasks) {
        fetchClosedTasks();
      }
    } catch (error) {
      console.error("Error adding follow-up:", error);
      toast.error("Failed to add follow-up comment");
    } finally {
      setLoading(false);
    }
  };

  // Get unique projects and dates from tasks
  const uniqueProjects = React.useMemo(() => {
    const projects = new Set();
    tasks.forEach(task => {
      if (task.project) projects.add(task.project);
    });
    return Array.from(projects).sort();
  }, [tasks]);

  const uniqueDates = React.useMemo(() => {
    const dates = new Set();
    tasks.forEach(task => {
      if (task.date) {
        // Handle both Date objects and date strings
        const dateKey = task.date instanceof Date 
          ? moment(task.date).format("YYYY-MM-DD")
          : moment(new Date(task.date)).format("YYYY-MM-DD");
        dates.add(dateKey);
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  }, [tasks]);

  // Filter tasks based on selected filters
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;
    
    if (selectedProjectFilter) {
      filtered = filtered.filter(task => task.project === selectedProjectFilter);
    }
    
    if (selectedDateFilter) {
      filtered = filtered.filter(task => {
        // Handle both Date objects and date strings
        const taskDate = task.date instanceof Date 
          ? moment(task.date).format("YYYY-MM-DD")
          : moment(new Date(task.date)).format("YYYY-MM-DD");
        return taskDate === selectedDateFilter;
      });
    }
    
    return filtered;
  }, [tasks, selectedProjectFilter, selectedDateFilter]);

  // Group filtered tasks by date
  const groupedTasks = React.useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      // Handle both Date objects and date strings
      const taskDate = task.date instanceof Date 
        ? moment(task.date).format("YYYY-MM-DD")
        : moment(new Date(task.date)).format("YYYY-MM-DD");
      if (!acc[taskDate]) {
        acc[taskDate] = [];
      }
      acc[taskDate].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  // Sort dates
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));

  // Handle closed tasks view
  useEffect(() => {
    if (showClosedTasks) {
      fetchClosedTasks();
    }
  }, [showClosedTasks]);

  // Determine which tasks to display
  const displayTasks = showClosedTasks ? closedTasks : filteredTasks;
  const displayGroupedTasks = showClosedTasks 
    ? closedTasks.reduce((acc, task) => {
        const dateKey = moment(task.date).format("YYYY-MM-DD");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(task);
        return acc;
      }, {})
    : groupedTasks;
  const displaySortedDates = showClosedTasks
    ? Object.keys(displayGroupedTasks).sort((a, b) => new Date(b) - new Date(a))
    : sortedDates;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-stone-100 dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-4">
              {/* Project Filter */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-green-600 dark:text-green-400 mb-2">
                  Project-wise
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProjectFilter(null);
                      setShowClosedTasks(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      !selectedProjectFilter && !showClosedTasks
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Projects
                  </button>
                  {uniqueProjects.map((proj) => (
                    <button
                      key={proj}
                      onClick={() => {
                        setSelectedProjectFilter(proj);
                        setShowClosedTasks(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors truncate ${
                        selectedProjectFilter === proj
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={proj}
                    >
                      {proj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="mb-6">
                <label className="block text-sm  text-green-600 dark:text-green-400 mb-2 font-semibold">
                  Date-wise
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedDateFilter(null);
                      setShowClosedTasks(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      !selectedDateFilter && !showClosedTasks
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Dates
                  </button>
                  {uniqueDates.map((dateKey) => (
                    <button
                      key={dateKey}
                      onClick={() => {
                        setSelectedDateFilter(dateKey);
                        setShowClosedTasks(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedDateFilter === dateKey
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {moment(dateKey).format("MMM DD, YYYY")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Closed Tasks Link */}
              <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                <button
                  onClick={() => {
                    setShowClosedTasks(true);
                    setSelectedProjectFilter(null);
                    setSelectedDateFilter(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                    showClosedTasks
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
                  }`}
                >
                  <FiFolder size={16} />
                  Closed Tasks
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {showClosedTasks ? "Closed Tasks" : "Daily Meeting Tasks"}
              </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <FiList size={20} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg ${
                viewMode === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <FiGrid size={20} />
            </button>
            {!showClosedTasks && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus size={20} />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingTask ? "Edit Task" : "New Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <DatePicker
                    selected={date}
                    onChange={(date) => setDate(date)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    dateFormat="MM/dd/yyyy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project *
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={projectInput}
                      onChange={handleProjectInputChange}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Search projects by name (ED/SS prefix only)..."
                      autoComplete="off"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  {project && (
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        Selected: <strong>{project}</strong>
                      </span>
                    </div>
                  )}
                  {showProjectSuggestions && projectInput && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-2 max-h-96 overflow-auto z-50">
                      {projectSearchLoading ? (
                        <div className="flex justify-center items-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : sortedProjectSuggestions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <p className="mb-2">No projects found matching "{projectInput}"</p>
                          <p className="text-xs">Try a different search term.</p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 sticky top-0">
                            <tr>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => requestProjectSort('project-wbs')}
                              >
                                WBS <ProjectSortIndicator columnKey="project-wbs" />
                              </th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => requestProjectSort('project-name')}
                              >
                                Name <ProjectSortIndicator columnKey="project-name" />
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Manager
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedProjectSuggestions.map((proj, idx) => (
                              <tr
                                key={proj["project-name"] + idx}
                                onClick={() => handleProjectSelect(proj)}
                                className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors ${
                                  project === proj["project-name"] ? 'bg-blue-100 dark:bg-blue-800' : ''
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {proj["project-wbs"] || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                  {proj["project-name"]}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                  {proj["project-incharge"] || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={selectdown}
                    onChange={(e) => setSelectdown(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="open PO">Open PO</option>
                    <option value="open PR">Open PR</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action By *
                  </label>
                  {editingTask ? (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {actionBy}
                      <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                        Note: Original comments cannot be edited. Use &quot;Add follow-up comment&quot; in the task list to add new comments.
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={actionBy}
                      onChange={(e) => setActionBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter action by"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discussion Point *
                </label>
                {editingTask ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {discussionPoint}
                    <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                      Note: Original comments cannot be edited. Use &quot;Add follow-up comment&quot; in the task list to add new comments.
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={discussionPoint}
                    onChange={(e) => setDiscussionPoint(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter discussion point"
                    required
                  />
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="closeFlag"
                  checked={closeFlag}
                  onChange={(e) => setCloseFlag(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="closeFlag" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mark as closed (will be archived)
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : editingTask ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

            {/* Tasks List/Cards */}
            {loading && displayTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tasks...</p>
              </div>
            ) : displayTasks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-600 dark:text-gray-400">
                  {showClosedTasks 
                    ? "No closed tasks found." 
                    : "No tasks found. Create a new task to get started."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {displaySortedDates.map((dateKey) => (
                  <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
                <h2 className="text-sm font-normal mb-4 text-gray-600 dark:text-gray-400 flex items-center gap-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <FiCalendar size={16} />
                  {moment(dateKey).format("MMMM DD, YYYY")}
                </h2>

                {viewMode === "list" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed bg-zinc-100 dark:bg-gray-800">
                      <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[12%]" />
                        <col className="w-[40%]" />
                        <col className="w-[15%]" />
                        <col className="w-[13%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-zinc-100 dark:bg-gray-800">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Project
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Category
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Discussion Point
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Action By
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayGroupedTasks[dateKey].map((task) => {
                          const discussionHistory = task.history ? task.history.filter(h => h.field === 'discussionPoint') : [];
                          const actionByHistory = task.history ? task.history.filter(h => h.field === 'actionBy') : [];
                          const maxHistoryLength = Math.max(discussionHistory.length, actionByHistory.length);
                          
                          return (
                          <tr
                            key={task._id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-zinc-200 dark:hover:bg-gray-700 bg-zinc-100 dark:bg-gray-800"
                          >
                            <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400 truncate font-normal" title={task.project} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                              {task.project}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs whitespace-nowrap">
                                {task.selectdown}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 break-words align-top">
                              <div className="flex flex-col h-full">
                                {/* Original comment - read-only */}
                                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100">
                                  {task.discussionPoint}
                                </div>
                                
                                {/* Follow-up comments */}
                                <div className="flex-1 flex flex-col justify-end">
                                  {maxHistoryLength > 0 && (
                                    <div className="space-y-1">
                                      {Array.from({ length: maxHistoryLength }).map((_, idx) => {
                                        const entry = discussionHistory[idx];
                                        return entry ? (
                                          <div
                                            key={idx}
                                            className={`text-sm p-2 rounded min-h-[60px] ${
                                              idx % 2 === 0
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            }`}
                                          >
                                            <div className="text-[10px] italic text-gray-500 dark:text-gray-400 mb-1">
                                              {entry.updatedBy} • {moment(entry.timestamp).format("MMM DD, YYYY HH:mm")}
                                            </div>
                                            <div className="mt-1">
                                              {entry.newText || entry.newValue}
                                            </div>
                                          </div>
                                        ) : (
                                          <div key={idx} className="min-h-[60px]"></div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Add follow-up comment */}
                                  {!showClosedTasks && (
                                    <div className="mt-2">
                                      {showFollowUpInput[`${task._id}-discussionPoint`] ? (
                                        <div className="space-y-2">
                                          <textarea
                                            value={followUpText[`${task._id}-discussionPoint`] || ''}
                                            onChange={(e) => setFollowUpText({
                                              ...followUpText,
                                              [`${task._id}-discussionPoint`]: e.target.value
                                            })}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Add follow-up comment..."
                                            rows={2}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleAddFollowUp(task._id, 'discussionPoint')}
                                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                              disabled={loading}
                                            >
                                              Add
                                            </button>
                                            <button
                                              onClick={() => {
                                                setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-discussionPoint`]: false });
                                                setFollowUpText({ ...followUpText, [`${task._id}-discussionPoint`]: '' });
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-discussionPoint`]: true })}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          + Add follow-up comment
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 break-words align-top">
                              <div className="flex flex-col h-full">
                                {/* Original action by - read-only */}
                                <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100">
                                  {task.actionBy}
                                </div>
                                
                                {/* Follow-up comments */}
                                <div className="flex-1 flex flex-col justify-end">
                                  {maxHistoryLength > 0 && (
                                    <div className="space-y-1">
                                      {Array.from({ length: maxHistoryLength }).map((_, idx) => {
                                        const entry = actionByHistory[idx];
                                        return entry ? (
                                          <div
                                            key={idx}
                                            className={`text-sm p-2 rounded min-h-[60px] ${
                                              idx % 2 === 0
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            }`}
                                          >
                                            <div className="text-[10px] italic text-gray-500 dark:text-gray-400 mb-1">
                                              {entry.updatedBy} • {moment(entry.timestamp).format("MMM DD, YYYY HH:mm")}
                                            </div>
                                            <div className="mt-1">
                                              {entry.newText || entry.newValue}
                                            </div>
                                          </div>
                                        ) : (
                                          <div key={idx} className="min-h-[60px]"></div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Add follow-up action by */}
                                  {!showClosedTasks && (
                                    <div className="mt-2">
                                      {showFollowUpInput[`${task._id}-actionBy`] ? (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={followUpText[`${task._id}-actionBy`] || ''}
                                            onChange={(e) => setFollowUpText({
                                              ...followUpText,
                                              [`${task._id}-actionBy`]: e.target.value
                                            })}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Add follow-up action by..."
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleAddFollowUp(task._id, 'actionBy')}
                                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                              disabled={loading}
                                            >
                                              Add
                                            </button>
                                            <button
                                              onClick={() => {
                                                setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-actionBy`]: false });
                                                setFollowUpText({ ...followUpText, [`${task._id}-actionBy`]: '' });
                                              }}
                                              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-actionBy`]: true })}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          + Add followup action by
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="flex justify-center gap-2">
                                {!showClosedTasks && (
                                  <>
                                    <button
                                      onClick={() => handleEdit(task)}
                                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Edit"
                                    >
                                      <FiEdit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleCloseTask(task)}
                                      className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                      title="Close Task"
                                    >
                                      <FiCheck size={16} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDelete(task._id)}
                                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="w-full" style={{ width: '90%' }}>
                    <div className="grid grid-cols-1 gap-4 w-full">
                      {displayGroupedTasks[dateKey].map((task) => (
                        <div
                          key={task._id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                        >
                        <div className="flex justify-between items-start mb-3">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                            {task.selectdown}
                          </span>
                          <div className="flex gap-1">
                            {!showClosedTasks && (
                              <>
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                  title="Edit"
                                >
                                  <FiEdit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleCloseTask(task)}
                                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400"
                                  title="Close"
                                >
                                  <FiCheck size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{task.project}</h3>
                        <div className="mb-3">
                          {/* Original discussion point - read-only */}
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {task.discussionPoint}
                          </div>
                          
                          {/* Follow-up comments */}
                          {task.history && task.history.filter(h => h.field === 'discussionPoint').length > 0 && (
                            <div className="mt-2 space-y-1">
                              {task.history
                                .filter(h => h.field === 'discussionPoint')
                                .map((entry, idx) => (
                                  <div
                                    key={idx}
                                    className={`text-xs p-2 rounded ${
                                      idx % 2 === 0
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    }`}
                                  >
                                    <div className="font-semibold text-xs">
                                      {entry.updatedBy} • {moment(entry.timestamp).format("MMM DD, YYYY HH:mm")}
                                    </div>
                                    <div className="mt-1">
                                      {entry.newText || entry.newValue}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Add follow-up comment */}
                          {!showClosedTasks && (
                            <div className="mt-2">
                              {showFollowUpInput[`${task._id}-discussionPoint`] ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={followUpText[`${task._id}-discussionPoint`] || ''}
                                    onChange={(e) => setFollowUpText({
                                      ...followUpText,
                                      [`${task._id}-discussionPoint`]: e.target.value
                                    })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Add follow-up comment..."
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAddFollowUp(task._id, 'discussionPoint')}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      disabled={loading}
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-discussionPoint`]: false });
                                        setFollowUpText({ ...followUpText, [`${task._id}-discussionPoint`]: '' });
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-discussionPoint`]: true })}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  + Add follow-up comment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mb-2">
                          {/* Original action by - read-only */}
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded mb-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <FiUser size={12} />
                              <span>{task.actionBy}</span>
                            </div>
                          </div>
                          
                          {/* Follow-up comments */}
                          {task.history && task.history.filter(h => h.field === 'actionBy').length > 0 && (
                            <div className="mt-2 space-y-1">
                              {task.history
                                .filter(h => h.field === 'actionBy')
                                .map((entry, idx) => (
                                  <div
                                    key={idx}
                                    className={`text-xs p-2 rounded ${
                                      idx % 2 === 0
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    }`}
                                  >
                                    <div className="font-semibold text-xs">
                                      {entry.updatedBy} • {moment(entry.timestamp).format("MMM DD, YYYY HH:mm")}
                                    </div>
                                    <div className="mt-1">
                                      {entry.newText || entry.newValue}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Add follow-up comment */}
                          {!showClosedTasks && (
                            <div className="mt-2">
                              {showFollowUpInput[`${task._id}-actionBy`] ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={followUpText[`${task._id}-actionBy`] || ''}
                                    onChange={(e) => setFollowUpText({
                                      ...followUpText,
                                      [`${task._id}-actionBy`]: e.target.value
                                    })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Add follow-up action by..."
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAddFollowUp(task._id, 'actionBy')}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      disabled={loading}
                                    >
                                      Add
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-actionBy`]: false });
                                        setFollowUpText({ ...followUpText, [`${task._id}-actionBy`]: '' });
                                      }}
                                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                      <button
                                        onClick={() => setShowFollowUpInput({ ...showFollowUpInput, [`${task._id}-actionBy`]: true })}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        + Add followup action by
                                      </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                )}
              </div>
            ))}
          </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
