import { useState } from "react";
import dynamic from "next/dynamic";

const VendorevaluationPDF = dynamic(() => import("./pdf"), {
  ssr: false,
});

const VendorEvaluationPDFNew = () => {
  const [vendorCodeFrom, setVendorCodeFrom] = useState("");
  const [vendorCodeTo, setVendorCodeTo] = useState("");
  const [showPDF, setShowPDF] = useState(false);
  const [filters, setFilters] = useState(null);

  const handleGenerate = () => {
    if (!vendorCodeFrom || !vendorCodeTo) {
      alert("Please enter both vendor code range values");
      return;
    }

    const fromCode = parseInt(vendorCodeFrom);
    const toCode = parseInt(vendorCodeTo);

    if (isNaN(fromCode) || isNaN(toCode)) {
      alert("Please enter valid numeric vendor codes");
      return;
    }

    if (fromCode > toCode) {
      alert("From vendor code must be less than or equal to To vendor code");
      return;
    }

    setFilters({
      vendorCodeFrom: fromCode,
      vendorCodeTo: toCode,
    });
    setShowPDF(true);
  };

  const handleReset = () => {
    setVendorCodeFrom("");
    setVendorCodeTo("");
    setShowPDF(false);
    setFilters(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      {!showPDF ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Vendor Evaluation PDF Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Generate PDF reports with custom filters
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vendor Code Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      From Vendor Code
                    </label>
                    <input
                      type="number"
                      value={vendorCodeFrom}
                      onChange={(e) => setVendorCodeFrom(e.target.value)}
                      placeholder="e.g., 1000"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      To Vendor Code
                    </label>
                    <input
                      type="number"
                      value={vendorCodeTo}
                      onChange={(e) => setVendorCodeTo(e.target.value)}
                      placeholder="e.g., 2000"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleGenerate}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Generate PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div className="mb-4 flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              PDF Preview
            </h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all"
            >
              Back to Filters
            </button>
          </div>
          <VendorevaluationPDF filters={filters} />
        </div>
      )}
    </div>
  );
};

export default VendorEvaluationPDFNew;

