import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";

async function generateExcelReport(filters) {
  let connection;
  try {
    // Connect to database
    connection = await connectDB();

    // Build query with filters
    let query = `
      SELECT lb.*, c.fullname as fullname, c.telno 
      FROM loan_bussiness lb
      LEFT JOIN customer c ON lb.customerid = c.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (filters.dateFrom && filters.dateTo) {
      query += ` AND lb.addat BETWEEN ? AND ?`;
      queryParams.push(
        `${filters.dateFrom} 00:00:00`,
        `${filters.dateTo} 23:59:59`
      );
    }

    if (filters.status && filters.status !== "all") {
      query += ` AND lb.status = ?`;
      queryParams.push(filters.status);
    }

    if (filters.ownershipType && filters.ownershipType !== "all") {
      query += ` AND lb.loanTypeMode = ?`;
      queryParams.push(filters.ownershipType);
    }

    if (filters.loanType && filters.loanType !== "all") {
      query += ` AND lb.loanType = ?`;
      queryParams.push(filters.loanType);
    }

    // Execute query
    const [rows] = await connection.query(query, queryParams);

    // Create workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Repayments Report");

    // Define columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Customer Name", key: "fullname", width: 20 },
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

    // Format database rows to match expected structure
    const formattedData = rows.map((row) => ({
      date: row.addat ? new Date(row.addat).toISOString().split("T")[0] : "",
      fullname: row.fullname || "",
      telno: row.telno || "",
      location: row.location || "",
      gs: row.gs || "",
      ds: row.ds || "",
      loanType: row.loanType || "",
      loanTypeMode: row.loanTypeMode || "",
      Totalpay: row.Totalpay || 0,
      // Calculate remaining amount (assuming it's Totalpay minus credit_balance)
      remainingAmount:
        parseFloat(row.Totalpay || 0) - parseFloat(row.credit_balance || 0),
      rate: row.rate || 0,
      status: row.status || "",
    }));

    // Add rows
    worksheet.addRows(formattedData);

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
  } finally {
    if (connection) {
      // Close database connection
      await connection.end();
    }
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
