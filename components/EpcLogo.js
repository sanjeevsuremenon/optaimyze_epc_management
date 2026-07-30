import React from "react";

function EpcLogo({ className = "", ...props }) {
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="text-lg font-black tracking-[0.2em]">EPC</span>
    </div>
  );
}

export default EpcLogo;
