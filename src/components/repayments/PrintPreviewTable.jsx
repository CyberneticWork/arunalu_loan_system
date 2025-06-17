"use client";

import React from "react";
import { useState } from "react";
import { Printer, X, Download } from "lucide-react";
import jsPDF from "jspdf";

export default function PrintPreviewTable({ isOpen, onClose, data = [] }) {
  const [filter, setFilter] = useState("all");

  if (!isOpen) return null;

  const filteredData = data.filter((item) => {
    if (filter === "all") return true;
    if (filter === "group") return item.loanTypeMode === "group";
    if (filter === "individual") return item.loanTypeMode === "normal";
    return true;
  });

  // Calculate number of pages needed
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(
    Math.max(filteredData.length, 1) / ROWS_PER_PAGE
  );

  // Generate page data with exactly 10 rows (including empty rows)
  const getPageData = (pageIndex) => {
    const startIdx = pageIndex * ROWS_PER_PAGE;
    const actualData = filteredData.slice(startIdx, startIdx + ROWS_PER_PAGE);
    const emptyRowsNeeded = ROWS_PER_PAGE - actualData.length;

    const emptyRows = Array(emptyRowsNeeded)
      .fill(null)
      .map((_, index) => ({
        loan_id: `empty-${pageIndex}-${index}`,
        group_name: "",
        customer_name: "",
        contact: "",
        installment: "",
        term: "",
        Totalpay: 0,
        Outstanding_amount: 0,
        isEmpty: true,
      }));

    return [...actualData, ...emptyRows];
  };

  // Calculate totals for a specific page (only counting non-empty rows)
  const calculatePageTotals = (pageIndex) => {
    const startIdx = pageIndex * ROWS_PER_PAGE;
    const pageData = filteredData.slice(startIdx, startIdx + ROWS_PER_PAGE);
    return {
      totalLoanAmount: pageData.reduce(
        (sum, item) => sum + Number(item.Totalpay || 0),
        0
      ),
      totalOutstanding: pageData.reduce(
        (sum, item) => sum + Number(item.Outstanding_amount || 0),
        0
      ),
    };
  };

  // Generate table for a specific page
  const TablePage = ({ pageIndex }) => {
    const pageData = getPageData(pageIndex);
    const { totalLoanAmount, totalOutstanding } =
      calculatePageTotals(pageIndex);

    return (
      <div className="print-page">
        {pageIndex > 0 && (
          <div className="print-header">
            <h2 className="text-xl font-bold text-gray-900">
              Loan Report - Page {pageIndex + 1}
            </h2>
            <p className="text-sm text-gray-600">
              Generated on {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
        )}
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
            {pageData.map((item, index) => (
              <tr
                key={item.loan_id || `row-${pageIndex}-${index}`}
                className="hover:bg-gray-50 h-[52px]"
              >
                <td className="border border-gray-200 px-4 py-3">
                  {!item.isEmpty ? item.group_name || "Individual" : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  {!item.isEmpty ? item.customer_name : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                  {!item.isEmpty ? item.contact : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3 font-mono text-sm">
                  {!item.isEmpty ? `${item.installment} × ${item.term}` : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right">
                  {!item.isEmpty && item.Totalpay
                    ? `LKR ${Number(item.Totalpay).toLocaleString()}`
                    : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right text-orange-600">
                  {!item.isEmpty && item.Outstanding_amount
                    ? `LKR ${Number(item.Outstanding_amount).toLocaleString()}`
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
        <div className="page-totals">
          <div className="flex justify-end mt-4">
            <div className="w-[300px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Page Total Loan Amount:</span>
                <span className="font-bold text-lg">
                  LKR {totalLoanAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Page Total Outstanding:</span>
                <span className="font-bold text-lg text-orange-600">
                  LKR {totalOutstanding.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    // Hide the buttons and filters before printing
    const filterButtons = document.querySelector(".flex.rounded-md.shadow-sm");
    const actionButtons = document.querySelector(".flex.gap-2");

    if (filterButtons) filterButtons.style.display = "none";
    if (actionButtons) actionButtons.style.display = "none";

    // Call browser print
    window.print();

    // Restore the buttons after printing
    if (filterButtons) filterButtons.style.display = "flex";
    if (actionButtons) actionButtons.style.display = "flex";
  };

  const generatePDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    // Process each page
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        doc.addPage();
      }

      let y = margin;

      // Add title
      doc.setFontSize(16);
      doc.text("Loan Report", margin, y);

      // Add date
      doc.setFontSize(10);
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GB")} - Page ${
          pageIndex + 1
        }`,
        margin,
        y + 7
      );

      y += 20;

      // Define table structure
      const columns = [
        { header: "Group Name", width: 25 },
        { header: "Member Name", width: 35 },
        { header: "Contact", width: 25 },
        { header: "Installment / Term", width: 30 },
        { header: "Loan Amount", width: 30 },
        { header: "Outstanding", width: 30 },
        { header: "Date 1", width: 15 },
        { header: "Ate 1", width: 12 },
        { header: "Date 2", width: 15 },
        { header: "Ate 2", width: 12 },
        { header: "Date 3", width: 15 },
        { header: "Ate 3", width: 12 },
        { header: "Date 4", width: 15 },
        { header: "Ate 4", width: 12 },
      ];

      // Draw table header
      let x = margin;
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);

      // Draw header background and borders
      columns.forEach((col) => {
        doc.setFillColor(245, 245, 245);
        doc.rect(x, y, col.width, 10, "FD");
        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.text(col.header, x + 2, y + 6);
        x += col.width;
      });

      y += 10;

      // Get page data (exactly 10 rows)
      const pageData = getPageData(pageIndex);

      // Draw exactly 10 rows
      pageData.forEach((item, rowIndex) => {
        x = margin;
        const rowHeight = 10;

        // Draw cell backgrounds and borders
        columns.forEach((col, colIndex) => {
          doc.rect(x, y, col.width, rowHeight, "S");

          // Add cell content only for non-empty rows
          if (!item.isEmpty) {
            doc.setFontSize(8);
            let text = "";
            switch (colIndex) {
              case 0:
                text = item.group_name || "Individual";
                break;
              case 1:
                text = item.customer_name || "";
                break;
              case 2:
                text = item.contact || "";
                break;
              case 3:
                text =
                  item.installment && item.term
                    ? `${item.installment} × ${item.term}`
                    : "";
                break;
              case 4:
                text = item.Totalpay
                  ? `LKR ${Number(item.Totalpay).toLocaleString()}`
                  : "";
                break;
              case 5:
                text = item.Outstanding_amount
                  ? `LKR ${Number(item.Outstanding_amount).toLocaleString()}`
                  : "";
                break;
            }

            if (text) {
              if (colIndex === 4 || colIndex === 5) {
                doc.text(text, x + col.width - 2, y + 6, { align: "right" });
              } else {
                doc.text(text, x + 2, y + 6);
              }
            }
          }

          // Draw dotted lines and checkboxes for all rows (empty and filled)
          if ([6, 8, 10, 12].includes(colIndex)) {
            // Draw dotted line for date columns
            for (let i = 2; i < col.width - 2; i += 2) {
              doc.line(x + i, y + rowHeight - 2, x + i + 1, y + rowHeight - 2);
            }
          } else if ([7, 9, 11, 13].includes(colIndex)) {
            // Draw checkbox for attendance columns
            doc.rect(x + 3, y + 2, 6, 6, "S");
          }

          x += col.width;
        });

        y += rowHeight;
      });

      // Add page totals
      const totals = calculatePageTotals(pageIndex);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");

      const totalY = y + 10;
      doc.text(
        `Page Total Loan Amount: LKR ${totals.totalLoanAmount.toLocaleString()}`,
        pageWidth - margin - 80,
        totalY
      );
      doc.text(
        `Page Total Outstanding: LKR ${totals.totalOutstanding.toLocaleString()}`,
        pageWidth - margin - 80,
        totalY + 7
      );
    }

    // Save the PDF
    doc.save("loan-report.pdf");
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
            {/* Filter Buttons */}
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
                onClick={generatePDF}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              {/* <button
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
              </button> */}
            </div>
          </div>
        </div>

        {/* Table Container with Scroll */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              {Array.from({ length: totalPages }, (_, i) => (
                <TablePage key={i} pageIndex={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Print styles */}
        <style jsx global>{`
          @page {
            size: A4 landscape;
            margin: 15mm 10mm;
          }

          @media print {
            html,
            body {
              width: 297mm;
              height: 210mm;
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

            h2.text-2xl {
              font-size: 14pt !important;
              margin-bottom: 4px !important;
            }

            .border-t.bg-gray-50 {
              position: fixed !important;
              bottom: 15mm !important;
              right: 10mm !important;
              width: auto !important;
              background: none !important;
              border: none !important;
            }

            .text-sm.text-gray-600 {
              display: none !important;
            }

            .bg-white,
            .bg-white *,
            .border-t.bg-gray-50,
            .border-t.bg-gray-50 * {
              visibility: visible !important;
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .border-b.border-dotted {
              border-bottom: 1px dotted #000 !important;
              min-height: 20px !important;
            }

            .w-5.h-5.border {
              border: 1.5px solid #000 !important;
              min-width: 16px !important;
              min-height: 16px !important;
            }

            .text-right,
            .font-bold.text-lg {
              white-space: nowrap !important;
              font-size: 9pt !important;
            }

            .print-page {
              page-break-after: always;
              margin-bottom: 20mm;
            }

            .print-page:last-child {
              page-break-after: avoid;
            }

            .print-header {
              margin-bottom: 10mm;
            }

            .page-totals {
              margin-top: 10mm;
              margin-bottom: 15mm;
              page-break-inside: avoid !important;
            }

            .bg-white,
            .bg-white *,
            .print-page,
            .print-page *,
            .page-totals,
            .page-totals * {
              visibility: visible !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
