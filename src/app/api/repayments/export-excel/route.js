import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

async function generateExcelReport(filters) {
  try {
    // Sample data for testing
    const sampleData = [
      {
        date: "2025-06-26",
        customerName: "John Doe",
        telno: "1234567890",
        location: "Branch A",
        gs: "Center 1",
        ds: "DS Office 1",
        loanType: "Business",
        loanTypeMode: "Individual",
        Totalpay: 50000,
        remainingAmount: 30000,
        rate: 12,
        status: "Active",
      },
      {
        date: "2025-06-26",
        customerName: "Jane Smith",
        telno: "0987654321",
        location: "Branch B",
        gs: "Center 2",
        ds: "DS Office 2",
        loanType: "Micro",
        loanTypeMode: "Group",
        Totalpay: 75000,
        remainingAmount: 45000,
        rate: 15,
        status: "Active",
      },
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Repayments Report");

    // Define columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Contact No", key: "telno", width: 15 },
      { header: "Branch", key: "location", width: 15 },
      { header: "Center", key: "gs", width: 15 },
      { header: "DS Office", key: "ds", width: 15 },
      { header: "Loan Type", key: "loanType", width: 15 },
      { header: "Payment Mode", key: "loanTypeMode", width: 15 },
      { header: "Total Amount", key: "Totalpay", width: 15 },
      { header: "Settlement", key: "remainingAmount", width: 15 },
      { header: "Interest Rate", key: "rate", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Add rows
    worksheet.addRows(sampleData);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Format number columns
    worksheet.columns.forEach((column) => {
      if (["Totalpay", "remainingAmount"].includes(column.key)) {
        column.numFmt = "#,##0.00";
      }
    });

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Excel generation error:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const filters = await request.json();
    const excelBuffer = await generateExcelReport(filters);

    const headers = {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=repayments-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`,
    };

    return new NextResponse(excelBuffer, { headers });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel report" },
      { status: 500 }
    );
  }
}
