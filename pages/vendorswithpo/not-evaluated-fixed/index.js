import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { getSession, useSession } from "next-auth/react";


import Tablecomponent, {
  SelectColumnFilter,
  Boldstyle3,
} from "../../../components/Tablecomponent";

import { FiClipboard, FiMessageSquare, FiLayers, FiX } from 'react-icons/fi';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";
import moment from 'moment';

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

function CommentsModal({ isOpen, onClose, vendor }) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (isOpen && vendor) {
      fetchComments();
    }
  }, [isOpen, vendor]);

  const fetchComments = async () => {
    try {
      const result = await fetch(`/api/registeredvendors/comment/${vendor}`);
      const json = await result.json();
      setComments(json);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!session?.user?.name) {
      toast.error("You must be logged in to add comments", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    try {
      const body = {
        title,
        comment,
        user: session.user.name,
      };

      await fetch(`/api/registeredvendors/comment/${vendor}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: new Headers({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      });

      toast.success("Comment added successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setTitle("");
      setComment("");
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Comments for {vendor}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Existing Comments */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Previous Comments</h3>
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{comment.title}</h4>
                      <span className="text-xs text-gray-500">
                        {moment(comment.updatedA).format("DD/MM/YYYY")}
                      </span>
                    </div>
                    <div 
                      className="text-sm text-gray-600 mb-2"
                      dangerouslySetInnerHTML={{ __html: comment.comment }}
                    />
                    <div className="text-xs text-gray-500">
                      By: {comment.updatedBy}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No comments yet</p>
            )}
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment
              </label>
              <ReactQuill
                value={comment}
                onChange={setComment}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ color: [] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
                  ],
                }}
                theme="snow"
                className="bg-white border border-gray-300 rounded-md min-h-[150px]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MapToGroupModal({ isOpen, onClose, vendor }) {
  const { data: session } = useSession();
  const [selectedValue, setSelectedValue] = useState("material");
  const [mattypeselected, setMattypeselected] = useState("ZOFC");
  const [matgroupselected, setMatgroupselected] = useState("");
  const [secondarymatgroupselected, setSecondarymatgroupselected] = useState("");
  const [servicecategorySelected, setServicecategorySelected] = useState("");
  const [servicesubcategorySelected, setServicesubcategorySelected] = useState("");
  const [mappedgroups, setMappedgroups] = useState([]);
  const [mattypes, setMattypes] = useState([]);
  const [servicetypes, setServicetypes] = useState([]);

  useEffect(() => {
    if (isOpen && vendor) {
      fetchMappedGroups();
      fetchMatTypes();
      fetchServiceTypes();
    }
  }, [isOpen, vendor]);

  const fetchMappedGroups = async () => {
    try {
      const result = await fetch(`/api/registeredvendors/matgroupmap/${vendor}`);
      const json = await result.json();
      setMappedgroups(json);
    } catch (error) {
      console.error('Error fetching mapped groups:', error);
    }
  };

  const fetchMatTypes = async () => {
    try {
      const result = await fetch(`/api/mattypes`);
      const json = await result.json();
      setMattypes(json);
    } catch (error) {
      console.error('Error fetching material types:', error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const result = await fetch(`/api/servicetypes`);
      const json = await result.json();
      setServicetypes(json);
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleMatgroupadd = async () => {
    if (!session?.user?.name) {
      toast.error("You must be logged in to map groups", {
        position: toast.POSITION.TOP_RIGHT,
      });
      return;
    }

    try {
      const body = {
        mattypeselected,
        matgroupselected,
        secondarymatgroupselected,
        user: session.user.name,
      };

      await fetch(`/api/registeredvendors/matgroupmap/${vendor}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: new Headers({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      });

      toast.success("Group mapped successfully!", {
        position: toast.POSITION.TOP_RIGHT,
      });

      setMatgroupselected("");
      setSecondarymatgroupselected("");
      fetchMappedGroups();
    } catch (error) {
      console.error('Error mapping group:', error);
      toast.error("Failed to map group", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const handleRadioChange = (value) => {
    setSelectedValue(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Map Groups for {vendor}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Already Mapped Groups */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Already Mapped Groups</h3>
            {mappedgroups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primary Material Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Secondary Material Group
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mappedgroups
                      ?.sort((a, b) => (a.type > b.type ? 1 : -1))
                      .sort((a, b) => (a.group > b.group ? 1 : -1))
                      .map((mg, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {mg.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mg.group}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                            {mg.secondarygroup}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No groups mapped yet</p>
            )}
          </div>

          {/* Group Type Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Select Group Type</h3>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="groupType"
                  value="material"
                  checked={selectedValue === "material"}
                  onChange={() => handleRadioChange("material")}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Material</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="groupType"
                  value="service"
                  checked={selectedValue === "service"}
                  onChange={() => handleRadioChange("service")}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Service</span>
              </label>
            </div>
          </div>

          {/* Material Groups Form */}
          {selectedValue === "material" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Type
                </label>
                <select
                  value={mattypeselected}
                  onChange={(e) => setMattypeselected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-gray-900"
                >
                  <option value="ZCVL" className="text-gray-900 font-medium">
                    ZCVL- Civil Materials
                  </option>
                  <option value="ZMEC" className="text-gray-900 font-medium">
                    ZMEC- Mechanical/Piping Materials
                  </option>
                  <option value="ZOFC" className="text-gray-900 font-medium">
                    ZOFC- Office/Camp consumables
                  </option>
                  <option value="ZELC" className="text-gray-900 font-medium">
                    ZELC- Electrical Materials
                  </option>
                  <option value="ZINS" className="text-gray-900 font-medium">
                    ZINS- Instrumentation Materials
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Material Group
                </label>
                <select
                  value={matgroupselected}
                  onChange={(e) => setMatgroupselected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Primary Group</option>
                  {mattypes
                    .filter((mt) => mt.mattype === mattypeselected)
                    .map((mg, idx) => (
                      <option key={idx} value={mg.matgroupprimarydesc}>
                        {mg.matgroupprimarydesc}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Material Group (Optional)
                </label>
                <select
                  value={secondarymatgroupselected}
                  onChange={(e) => setSecondarymatgroupselected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Secondary Group</option>
                  {mattypes
                    .filter((mt) => mt.matgroupprimarydesc === matgroupselected)
                    .map((mg, idx) => (
                      <option key={idx} value={mg.matgroupsecondarydesc}>
                        {mg.matgroupsecondarydesc}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleMatgroupadd}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Map Group
                </button>
              </div>
            </div>
          )}

          {/* Service Groups Form */}
          {selectedValue === "service" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Category
                </label>
                <select
                  value={servicecategorySelected}
                  onChange={(e) => setServicecategorySelected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Service Category</option>
                  <option value="Civil">Civil</option>
                  <option value="Piping">Piping</option>
                  <option value="Training">Training</option>
                  <option value="Vendor inspection">Vendor inspection</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Third party services">Third party services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Sub Category
                </label>
                <select
                  value={servicesubcategorySelected}
                  onChange={(e) => setServicesubcategorySelected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Sub Category</option>
                  {servicetypes
                    .filter((st) => st.servicecategory === servicecategorySelected)
                    .map((st, idx) => (
                      <option key={idx} value={st.servicesubcategory}>
                        {st.servicesubcategory}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleMatgroupadd}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Map Service
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VendorsNotEvaluatedFixed() {
  const router = useRouter();

  const [selectedVendor, setSelectedVendor] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isMapToGroupModalOpen, setIsMapToGroupModalOpen] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState("");

  function handleEdit(row) {
    const vendor = row.original;
    router.push(
      `/vendorswithpo/vendorevaluation1?vendornumber=${vendor["vendor-code"]}`
    );
  }

  function handleComent(row) {
    const vendor = row.original;
    setSelectedVendorName(vendor["vendor-name"]);
    setIsCommentsModalOpen(true);
  }

  function handleMapgroup(row) {
    const vendor = row.original;
    setSelectedVendorName(vendor["vendor-name"]);
    setIsMapToGroupModalOpen(true);
  }

  const columns = useMemo(
    () => [
      {
        Header: "Vendor Number",
        accessor: "vendor-code",
        Cell: Boldstyle3,
        Filter: SelectColumnFilter,
        width: 150,
      },
      {
        Header: "Vendor Name",
        accessor: "vendor-name",
        Cell: ({ value }) => (
          <div className="max-w-[40vw] break-words">
            <span className="font-semibold">{value}</span>
          </div>
        ),
        width: '40%',
      },
      {
        Header: "Actions",
        id: "actions",
        accessor: (row) => row,
        Cell: ({ row }) => (
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-blue-500/90 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 transition-all duration-200 shadow-sm"
            >
              <FiClipboard className="w-3.5 h-3.5 mr-1.5" />
              Evaluation
            </button>
            <button
              onClick={() => handleComent(row)}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-orange-400/90 rounded-md hover:bg-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-300 focus:ring-offset-1 transition-all duration-200 shadow-sm"
            >
              <FiMessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Comments
            </button>
            <button
              onClick={() => handleMapgroup(row)}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-500/90 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:ring-offset-1 transition-all duration-200 shadow-sm"
            >
              <FiLayers className="w-3.5 h-3.5 mr-1.5" />
              Map to Group
            </button>
          </div>
        ),
        width: 'auto',
      },
    ],
    []
  );

  const [vendorlist, setVendorlist] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetch(`/api/vendors/povendor/not-evaluated-fixed`);
        const json = await result.json();
        setVendorlist(json);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        toast.error('Failed to load vendors', {
          position: toast.POSITION.TOP_RIGHT,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Vendors Not Evaluated for Fixed Scores
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                List of vendors with purchase orders in 2024 who have not yet been evaluated for fixed scores
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {vendorlist.length > 0 ? (
                  <Tablecomponent 
                    columns={columns} 
                    data={vendorlist}
                    className="min-w-full divide-y divide-gray-200"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      All vendors with purchase orders in 2024 have been evaluated for fixed scores.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
      <CommentsModal 
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        vendor={selectedVendorName}
      />
      <MapToGroupModal
        isOpen={isMapToGroupModalOpen}
        onClose={() => setIsMapToGroupModalOpen(false)}
        vendor={selectedVendorName}
      />
    </>
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

export default VendorsNotEvaluatedFixed;





