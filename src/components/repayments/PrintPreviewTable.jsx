"use client";

import React from "react";
import { useState } from "react";
import { Printer, X } from "lucide-react";

export default function PrintPreviewTable({ isOpen, onClose, data = [] }) {
  const [filter, setFilter] = useState("all"); // Add filter state

  if (!isOpen) return null;

  // Filter data based on selection
  const filteredData = data.filter((item) => {
    if (filter === "all") return true;
    if (filter === "group") return item.loanTypeMode === "group";
    if (filter === "individual") return item.loanTypeMode === "normal";
    return true;
  });

  const totalLoanAmount = filteredData.reduce(
    (sum, item) => sum + Number(item.Totalpay),
    0
  );
  const totalOutstanding = filteredData.reduce(
    (sum, item) => sum + Number(item.Outstanding_amount),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  // Add this helper function after the filter state declaration
  const generateEmptyRows = (dataLength) => {
    const emptyRowCount = Math.max(10 - dataLength, 0);
    return Array(emptyRowCount).fill({
      loan_id: "empty",
      group_name: "",
      customer_name: "",
      contact: "",
      installment: "",
      term: "",
      Totalpay: "",
      Outstanding_amount: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[95%] max-w-6xl h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Loan Report</h2>
            <p className="text-sm text-gray-600">
              Generated on {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Add Filter Buttons */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium border ${
                  filter === "all"
                    ? "bg-blue-50 border-blue-600 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                } rounded-l-md`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("group")}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  filter === "group"
                    ? "bg-blue-50 border-blue-600 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Group
              </button>
              <button
                onClick={() => setFilter("individual")}
                className={`px-4 py-2 text-sm font-medium border ${
                  filter === "individual"
                    ? "bg-blue-50 border-blue-600 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                } rounded-r-md`}
              >
                Individual
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={onClose}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Table Container with Scroll */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                      Group Name
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                      Member Name
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                      Contact
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                      Installment / Term
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                      Loan Amount
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-right font-semibold text-gray-900">
                      Outstanding
                    </th>
                    {/* Add 4 sets of Date and Attendance columns */}
                    {[1, 2, 3, 4].map((num) => (
                      <React.Fragment key={`header-${num}`}>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                          Date {num}
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                          Attend {num}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredData, ...generateEmptyRows(filteredData.length)]
                    .slice(0, 10)
                    .map((item, index) => (
                      <tr
                        key={`${item.loan_id}-${index}`}
                        className={`hover:bg-gray-50 ${
                          item.loan_id === "empty" ? "h-[52px]" : ""
                        }`}
                      >
                        <td className="border border-gray-200 px-4 py-3">
                          {item.loan_id !== "empty"
                            ? item.group_name || "Individual"
                            : ""}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          {item.loan_id !== "empty" ? item.customer_name : ""}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                          {item.loan_id !== "empty" ? item.contact : ""}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                          {item.loan_id !== "empty"
                            ? `${item.installment} × ${item.term}`
                            : ""}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right">
                          {item.loan_id !== "empty"
                            ? `LKR ${Number(item.Totalpay).toLocaleString()}`
                            : ""}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right text-orange-600">
                          {item.loan_id !== "empty"
                            ? `LKR ${Number(
                                item.Outstanding_amount
                              ).toLocaleString()}`
                            : ""}
                        </td>
                        {/* Add 4 sets of empty date and checkbox cells */}
                        {[1, 2, 3, 4].map((num) => (
                          <React.Fragment key={`attendance-${index}-${num}`}>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              <div className="h-8 border-b border-dotted border-gray-400"></div>
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              <div className="flex justify-center items-center h-8">
                                <div className="w-5 h-5 border border-gray-400"></div>
                              </div>
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredData.length}{" "}
              {filter === "all" ? "total" : filter} loans
            </div>
            <div className="w-[300px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Loan Amount:</span>
                <span className="font-bold text-lg">
                  LKR {totalLoanAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Outstanding:</span>
                <span className="font-bold text-lg text-orange-600">
                  LKR {totalOutstanding.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Print-only styles */}
        <style jsx global>{`
          @page {
            size: A4 landscape;
            margin: 15mm 10mm;
          }

          @media print {
            html,
            body {
              width: 297mm; /* A4 width in landscape */
              height: 210mm; /* A4 height in landscape */
              margin: 0;
              padding: 0;
            }

            body * {
              visibility: hidden;
            }

            .fixed {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .bg-black\/50 {
              background: none !important;
            }

            .overflow-hidden,
            .overflow-auto {
              overflow: visible !important;
            }

            button,
            .flex.rounded-md.shadow-sm {
              display: none !important;
            }

            table {
              font-size: 9pt !important;
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto !important;
            }

            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }

            th,
            td {
              padding: 4px !important;
              border: 1px solid #000 !important;
            }

            /* Make the header text smaller */
            h2.text-2xl {
              font-size: 14pt !important;
              margin-bottom: 4px !important;
            }

            /* Format the summary section */
            .border-t.bg-gray-50 {
              position: fixed !important;
              bottom: 15mm !important;
              right: 10mm !important;
              width: auto !important;
              background: none !important;
              border: none !important;
            }

            /* Hide the showing X loans text */
            .text-sm.text-gray-600 {
              display: none !important;
            }

            /* Make sure everything is visible */
            .bg-white,
            .bg-white *,
            .border-t.bg-gray-50,
            .border-t.bg-gray-50 * {
              visibility: visible !important;
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Format dotted lines and checkboxes */
            .border-b.border-dotted {
              border-bottom: 1px dotted #000 !important;
              min-height: 20px !important;
            }

            .w-5.h-5.border {
              border: 1.5px solid #000 !important;
              min-width: 16px !important;
              min-height: 16px !important;
            }

            /* Ensure currency amounts are readable */
            .text-right,
            .font-bold.text-lg {
              white-space: nowrap !important;
              font-size: 9pt !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
