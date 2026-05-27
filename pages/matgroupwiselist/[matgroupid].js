import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
// import moment from 'moment'
import Tablecomponent, {
  SelectColumnFilter,
  Mattype,
  Cellstyle,
  Datestyle,
  Boldstyle1,
  Boldstyle2,
} from "../../components/Tablecomponent";
import Matedit from "../../components/Mateditcomponent";
import { useSession } from "next-auth/react";

function Matgroup() {
  const router = useRouter();

  const { data: session } = useSession();
  console.log(session?.user?.name);

  let matgroupid = router.query.matgroupid;
  // console.log(router.query.matgroupid)

  const [selectedMaterial, setSelectedMaterial] = useState({});
  const [editmode, setEditmode] = useState(true);

  function handleEdit(row) {
    const material = row.row.values;
    setEditmode(true)
    console.log(material);
    setSelectedMaterial({ ...material, matgroupid });
    setShowModal(true);
  }

  function handleComment(row) {
    const material = row.row.values;
    setEditmode(false)
    console.log(material);
    setSelectedMaterial({ ...material, matgroupid });
    setShowModal(true);
  }

  const columns = useMemo(
    () => [
      // first group - TV Show
      // Header: `List of materials in group ${matgroupid}`,
      // First group columns
      // columns: [
      {
        Header: "Material Code",
        accessor: "material-code",
        Cell: Boldstyle1,
      },
      {
        Header: "Material Description",
        accessor: "material-description",
        Cell: Boldstyle2,
      },
      {
        Header: "Unit of Measure",
        accessor: "unit-measure",
      },

      {
        Header: "Material Industry",
        accessor: "material-industry",
      },
      {
        Header: "Material Type",
        accessor: "material-type",
        Cell: Mattype,
      },

      {
        Header: "Old Material Number",
        accessor: "old-material-number",
      },
      {
        Header: "User",
        accessor: "created-by",
        Filter: SelectColumnFilter, // new
        filter: "includes", // new
        Cell: Boldstyle1,
      },
      {
        Header: "Date",
        accessor: "created_date",
        // Filter: SelectColumnFilter,  // new
        // filter: 'includes',  // new
        Cell: Datestyle,
      },
      {
        Header: "Action",
        accesor: "action",
        Cell: (row) => (
          <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">
            {session?.user?.name === "suresh" ? (
              <button onClick={(e) => handleEdit(row)}> Edit </button>
            ) : (
              <button onClick={(e) => handleComment(row)}> Comment</button>
            )}
          </div>
        ),
      },
    ],

    // ],
    []
  );

  const [matlist, setMatlist] = useState([]);
  const [matgroupdet, setMatgroupdet] = useState({})
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/matgroup/materials/${matgroupid}`);
      const json = await result.json()
      let filjson = Array.from(json.filter(mat=> mat["material-description"] !== "UNDER CONSTRUCTION -DO NOT USE"))
      setMatlist(filjson);
    })();
  }, [matgroupid]);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/matgroup/${matgroupid}`);
      let json = await result.json()   
         
      setMatgroupdet(json);
    })();
  }, [matgroupid]);

  console.log(matlist);
  return (
    <>      <div className="min-h-screen bg-gray-50 text-gray-900 w-[98%] ml-9">
        <div className="mt-6">
          <p className="font-bold text-md mb-3">
            List of materials in group {matgroupid}
          </p>
          <Tablecomponent columns={columns} data={matlist} />
          {showModal ? (
            <Matedit material={selectedMaterial} matgroupdet = {matgroupdet} setShowModal={setShowModal}  editmode={editmode} />
          ) : null}
        </div>
      </div>    </>
  );
}

export default Matgroup;
