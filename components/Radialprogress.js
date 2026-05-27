import React from "react";

function Radialprogress({ percent }) {
  return (
    <div className="mx-auto w-full">
      <div className="w-full  bg-red-800 dark:bg-gray-700">
        <div
          className={`bg-green-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none`} style={{width:`${percent}%`}}
        >
          {" "}
          {percent}%
        </div>
      </div>
    </div>
  );
}

export default Radialprogress;
