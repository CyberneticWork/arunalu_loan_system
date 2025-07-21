"use client";

import React from "react";
import { useState } from "react";
import { Printer, X, Download, ChevronDown, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PrintPreviewTable({ isOpen, onClose, data = [] }) {
  const [filter, setFilter] = useState("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [centerFilter, setCenterFilter] = useState("");
  const [isCenterDropdownOpen, setIsCenterDropdownOpen] = useState(false);
  const [centerSearchTerm, setCenterSearchTerm] = useState("");

  if (!isOpen) return null;

  // Get unique centers for dropdown
  const centers = [...new Set(data.map(item => item.gs).filter(Boolean))].sort();

  const filteredData = data.filter((item) => {
    if (filter === "group" && item.loanTypeMode !== "group") return false;
    if (filter === "individual" && item.loanTypeMode !== "normal") return false;
    if (loanTypeFilter && item.loanType !== loanTypeFilter) return false;
    if (typeFilter && (!item.type || item.type.toLowerCase() !== typeFilter.toLowerCase())) return false;
    if (centerFilter && item.gs !== centerFilter) return false;
    return true;
  });

  // Calculate number of pages needed
  const ROWS_PER_PAGE = 10;
  const totalPages = Math.ceil(Math.max(filteredData.length, 1) / ROWS_PER_PAGE);

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
        gs: "",
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
      totalLoanAmount: pageData.reduce((sum, item) => sum + Number(item.Totalpay || 0), 0),
      totalOutstanding: pageData.reduce((sum, item) => sum + Number(item.Outstanding_amount || 0), 0),
    };
  };

  // Function to wrap text for long names
  const wrapText = (text, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxLength) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  };

  // Generate table for a specific page
  const TablePage = ({ pageIndex }) => {
    const pageData = getPageData(pageIndex);
    const { totalLoanAmount, totalOutstanding } = calculatePageTotals(pageIndex);

    return (
      <div className="print-page">
        {pageIndex > 0 && (
          <div className="print-header">
            <h2 className="text-xl font-bold text-gray-900">
              Loan Report - Page {pageIndex + 1}
              {centerFilter && ` - ${centerFilter} Center`}
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
                Center
              </th>
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">
                Loan Type (Type)
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
                <td className="border border-gray-200 px-4 py-3 whitespace-pre-line text-sm">
                  {!item.isEmpty ? wrapText(item.customer_name) : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  {!item.isEmpty ? item.gs : ""}
                </td>
                <td className="border border-gray-200 px-4 py-3">
                  {!item.isEmpty
                    ? `${item.loanType || ""}${item.type ? ` (${item.type})` : ""}`
                    : ""}
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

            {/* Total row at the end */}
            <tr className="h-[52px] font-bold bg-gray-50">
              <td className="border border-gray-200 px-4 py-3">Total</td>
              <td className="border border-gray-200 px-4 py-3"></td>
              <td className="border border-gray-200 px-4 py-3"></td>
              <td className="border border-gray-200 px-4 py-3"></td>
              <td className="border border-gray-200 px-4 py-3"></td>
              <td className="border border-gray-200 px-4 py-3"></td>
              <td className="border border-gray-200 px-4 py-3"></td>
              {/* Empty cells for dates and attendance */}
              {[1, 2, 3, 4].map((num) => (
                <React.Fragment key={`total-attendance-${num}`}>
                  <td className="border border-gray-200 px-4 py-3"></td>
                  <td className="border border-gray-200 px-4 py-3"></td>
                </React.Fragment>
              ))}
            </tr>
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
    const filterButtons = document.querySelector(".flex.rounded-md.shadow-sm");
    const actionButtons = document.querySelector(".flex.gap-2");

    if (filterButtons) filterButtons.style.display = "none";
    if (actionButtons) actionButtons.style.display = "none";

    window.print();

    if (filterButtons) filterButtons.style.display = "flex";
    if (actionButtons) actionButtons.style.display = "flex";
  };

  const generatePDF = () => {
    // Create PDF in A4 landscape (297mm x 210mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const tableStartY = 25; // Start table lower to accommodate header

    // Process each page
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) {
        doc.addPage('a4', 'landscape');
      }

      // Add title with center name if selected
      doc.setFontSize(12);
      const title = centerFilter ? `Loan Report - ${centerFilter} Center` : "Loan Report";
      doc.text(title, margin, 10);

      // Add date and page info
      doc.setFontSize(10);
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-GB")} - Page ${pageIndex + 1}`,
        margin,
        17
      );

      // Prepare table data
      const pageData = getPageData(pageIndex).filter(item => !item.isEmpty);
      
      // Define columns
      const columns = [
        { header: "Group Name", dataKey: "group_name" },
        { header: "Member Name", dataKey: "customer_name" },
        { header: "Contact", dataKey: "contact" },
        { header: "Center", dataKey: "gs" },
        { header: "Loan Type", dataKey: "loanType" },
        { header: "Installment / Term", dataKey: "installment_term" },
        { header: "Loan Amount", dataKey: "Totalpay" },
        { header: "Outstanding", dataKey: "Outstanding_amount" },
        { header: "Date 1", dataKey: "date1" },
        { header: "Attend 1", dataKey: "attend1" },
        { header: "Date 2", dataKey: "date2" },
        { header: "Attend 2", dataKey: "attend2" },
        { header: "Date 3", dataKey: "date3" },
        { header: "Attend 3", dataKey: "attend3" },
        { header: "Date 4", dataKey: "date4" },
        { header: "Attend 4", dataKey: "attend4" },
      ];

      // Prepare data for autoTable
      const body = pageData.map(item => ({
        group_name: item.group_name || "Individual",
        customer_name: item.customer_name,
        contact: item.contact,
        gs: item.gs,
        loanType: `${item.loanType || ""}${item.type ? ` (${item.type})` : ""}`,
        installment_term: `${item.installment} × ${item.term}`,
        Totalpay: `LKR ${Number(item.Totalpay).toLocaleString()}`,
        Outstanding_amount: `LKR ${Number(item.Outstanding_amount).toLocaleString()}`,
        date1: "",
        attend1: "",
        date2: "",
        attend2: "",
        date3: "",
        attend3: "",
        date4: "",
        attend4: "",
      }));

      // Add the table
      autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: body.map(row => columns.map(col => row[col.dataKey])),
        startY: tableStartY,
        margin: { top: tableStartY },
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          overflow: 'linebreak',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Group Name
          1: { cellWidth: 35 }, // Member Name
          2: { cellWidth: 20 }, // Contact
          3: { cellWidth: 25 }, // Center
          4: { cellWidth: 30 }, // Loan Type
          5: { cellWidth: 25 }, // Installment/Term
          6: { cellWidth: 25, halign: 'right' }, // Loan Amount
          7: { cellWidth: 25, halign: 'right' }, // Outstanding
          // Date and attendance columns
          ...Array.from({ length: 8 }, (_, i) => ({ 
            [7 + i]: { cellWidth: i % 2 === 0 ? 15 : 12 } 
          })
      )},
        didDrawPage: (data) => {
          // Add totals after table
          const totals = calculatePageTotals(pageIndex);
          doc.setFontSize(10);
          doc.setFont(undefined, "bold");
          
          const totalsY = data.cursor.y + 10;
          doc.text(
            `Page Total Loan Amount: LKR ${totals.totalLoanAmount.toLocaleString()}`,
            pageWidth - margin - 80,
            totalsY
          );
          doc.text(
            `Page Total Outstanding: LKR ${totals.totalOutstanding.toLocaleString()}`,
            pageWidth - margin - 80,
            totalsY + 7
          );
        }
      });
    }

    // Save the PDF
    const fileName = centerFilter ? `loan-report-${centerFilter}-center.pdf` : "loan-report.pdf";
    doc.save(fileName);
  };

  // Filter centers based on search term
  const filteredCenters = centers.filter(center =>
    center.toLowerCase().includes(centerSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[95%] max-w-6xl h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Loan Report{centerFilter && ` - ${centerFilter} Center`}
            </h2>
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

            {/* Center Dropdown Filter */}
            <div className="relative">
              <button
                onClick={() => setIsCenterDropdownOpen(!isCenterDropdownOpen)}
                className="flex items-center justify-between px-3 py-2 text-sm border rounded-md w-40 bg-white hover:bg-gray-50"
              >
                <span>{centerFilter || "All Centers"}</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {isCenterDropdownOpen && (
                <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search centers..."
                        className="pl-8 pr-2 py-1.5 w-full text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={centerSearchTerm}
                        onChange={(e) => setCenterSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <button
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        !centerFilter ? "bg-blue-50 text-blue-600" : ""
                      }`}
                      onClick={() => {
                        setCenterFilter("");
                        setIsCenterDropdownOpen(false);
                      }}
                    >
                      All Centers
                    </button>
                    {filteredCenters.map((center) => (
                      <button
                        key={center}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          centerFilter === center ? "bg-blue-50 text-blue-600" : ""
                        }`}
                        onClick={() => {
                          setCenterFilter(center);
                          setIsCenterDropdownOpen(false);
                        }}
                      >
                        {center}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Loan Type Filter */}
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">All Loan Types</option>
              {[...new Set(data.map((d) => d.loanType).filter(Boolean))].map((lt) => (
                <option key={lt} value={lt}>{lt}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={generatePDF}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
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

            .whitespace-pre-line {
              white-space: pre-line !important;
              font-size: 8pt !important;
              line-height: 1.2 !important;
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