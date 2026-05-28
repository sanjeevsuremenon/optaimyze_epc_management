import React from "react";
import moment from "moment";

const Matdocument = React.forwardRef(({ matdoc }, ref) => {
  if (!matdoc) {
    return null;
  }

  const accountText = matdoc.account?.wbs || matdoc.account?.network || matdoc.account?.["cost-center"] || matdoc.account?.["sale-order"] || "*****";

  const MatdocContent = (
    <tr
      className="bg-slate-900/50 border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-150 group text-sm"
      ref={ref}
      key={matdoc._id}
    >
      <td className="px-4 py-3 font-semibold text-cyan-400 break-words">
        {matdoc.documentnumber || matdoc["doc-number"]}
      </td>
      <td className="px-4 py-3 font-medium text-slate-300 break-words">
        {matdoc.documentlineitem || matdoc["doc-item"]}
      </td>
      <td className="px-4 py-3 font-medium text-slate-400 break-words">
        {moment(matdoc.documentdate || matdoc["doc-date"]).format("MM-DD-YYYY")}
      </td>
      <td className="px-4 py-3 font-medium text-slate-300 break-words">
        {matdoc.material || matdoc["material-code"]}
      </td>
      <td className="px-4 py-3 font-medium text-slate-200">
        <div className="w-full whitespace-normal break-words">
          {matdoc.materialdescription || matdoc["material-text"]}
        </div>
      </td>
      <td className="px-4 py-3 font-bold text-white break-words">
        {matdoc.documentqty?.$numberDecimal || matdoc["doc-qty"]?.$numberDecimal}
      </td>
      <td className="px-4 py-3 font-bold text-emerald-400 break-words">
        {matdoc.documentvalue || matdoc["doc-amount"]}
      </td>
      <td className="px-4 py-3 font-medium text-slate-400">
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-slate-800 rounded">{matdoc.plant || matdoc["plant-code"]}</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded">{matdoc.sloc || "****"}</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-cyan-300">{matdoc.movementtype || matdoc["mvt-type"]}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-slate-300 break-words">
        {accountText}
      </td>
    </tr>
  );

  return MatdocContent;
});

export default Matdocument;
