import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";

async function generateExcelReport(filters) {
  let connection;
  try {
    // Connect to database
    connection = await connectDB();

    // Build query with filters - enhanced to get all needed fields
    let query = `
      SELECT 
      lb.*, 
      c.fullname as fullname,
      r.paid_amount,
      r.TotInterest as interest_paid,
      (r.paid_amount + r.TotInterest) as total_paid,
      CASE 
        WHEN r.balance < 0 THEN ABS(r.balance)
        ELSE 0 
      END as arrears,
      CASE 
        WHEN r.balance > 0 THEN r.balance
        ELSE 0 
      END as over_payment,
      lb.activate_date as activate_date,
      COUNT(rp.id) as payment_count,
      lb.Installment as installment
      FROM loan_bussiness lb
      LEFT JOIN customer c ON lb.customerid = c.id
      LEFT JOIN (
      SELECT 
        loan_bussiness_id, 
        SUM(paid_amount) as paid_amount,
        SUM(TotInterest) as TotInterest,
        SUM(balance) as balance
      FROM repayment
      GROUP BY loan_bussiness_id
      ) r ON r.loan_bussiness_id = lb.id
      LEFT JOIN repayment rp ON rp.loan_bussiness_id = lb.id
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

    // Add GROUP BY clause for counting payments
    query += ` GROUP BY lb.id`;

    // Execute query
    const [rows] = await connection.query(query, queryParams);

    // Create workbook and sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Repayments Report");

    // Keep these column definitions exactly as they are
    worksheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Center", key: "center", width: 12 },
      { header: "Group", key: "group", width: 12 },
      { header: "Customer Name", key: "fullname", width: 20 },
      { header: "Loan Amount", key: "loanAmount", width: 12 },
      { header: "Loan Installment", key: "contractid", width: 15 },
      { header: "Service Charge", key: "serviceCharge", width: 12 },
      { header: "Total Outstanding", key: "Totalpay", width: 12 },
      { header: "Paid Amount", key: "paidAmount", width: 12 },
      { header: "Total Capital", key: "totalCapital", width: 12 },
      { header: "Total Interest", key: "totalInterest", width: 12 },
      { header: "Interest Income", key: "interestPaid", width: 12 },
      { header: "Paid Interest Income", key: "totalPaid", width: 12 },
      { header: "Arrears", key: "arrears", width: 12 },
      { header: "Over Payment", key: "overPayment", width: 12 },
      { header: "Loan Term", key: "term", width: 10 },
      { header: "Due Date", key: "dueDate", width: 12 },
    ];

    // Format database rows to match expected structure with clearer mapping
    const formattedData = rows.map((row) => {
      // Calculate values based on the available data
      const paidAmount = row.paid_amount || 0;
      const interestPaid = row.interest_paid || 0;
      const totalPaid = row.total_paid || 0;
      const paymentCount = row.payment_count || 0;

      // Calculate due date as overdue count instead of a date
      const dueDate = calculateDueDate(
        row.activate_date,
        row.term,
        row.type,
        paymentCount,
        row.status
      );

      // Map database fields to column keys precisely
      return {
        // Date column - use addat field
        date: row.addat ? new Date(row.addat).toISOString().split("T")[0] : "",

        // Center column - use gs field
        center: row.gs || "",

        // Group column - determine from loanTypeMode
        group: row.loanTypeMode === "group" ? row.group_name : "Individual",

        // Customer Name column - use fullname from customer table
        fullname: row.fullname || "",

        // Loan Amount column - use loanAmount field
        loanAmount: row.loanAmount || 0,

        // Loan Installment column - use contractid field as requested
        contractid: row.contractid || "",

        // Service Charge column - use serviceCharge field
        serviceCharge: row.serviceCharge || 0,

        // Total Outstanding column - use Totalpay field
        Totalpay: row.Totalpay || 0,

        // Paid Amount column - use calculated paidAmount
        paidAmount: paidAmount,

        // Total Capital column - calculate based on Totalpay and rate
        totalCapital:
          (row.Totalpay || 0) - ((row.Totalpay || 0) * row.rate) / 100,

        // Total Interest column - calculate based on Totalpay and rate
        totalInterest: ((row.Totalpay || 0) * row.rate) / 100,

        // Interest Income column - use interestPaid from query
        interestPaid: interestPaid,

        // Paid Interest Income column - use totalPaid from query
        totalPaid: totalPaid,

        // Arrears column - use calculated arrears
        arrears: row.arrears || 0,

        // Over Payment column - use calculated over_payment
        overPayment: row.over_payment || 0,

        // Loan Term column - use term field
        term: row.term || "",

        // Due Date column - use calculated dueDate (now as a number)
        dueDate: dueDate,
      };
    });

    // Add rows
    worksheet.addRows(formattedData);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Format number columns with currency
    worksheet.columns.forEach((column) => {
      if (
        [
          "loanAmount",
          "serviceCharge",
          "Totalpay",
          "paidAmount",
          "totalCapital",
          "totalInterest",
          "interestPaid",
          "totalPaid",
          "arrears",
          "overPayment",
        ].includes(column.key)
      ) {
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

// Function to calculate due date as number of overdue days
function calculateDueDate(activateDate, term, type, paymentCount, status) {
  if (!activateDate || !term || !type || status !== "active") {
    return "";
  }

  // Parse term to get the number
  const termNumber = parseInt(term.match(/\d+/)[0] || 0);

  // If all payments are done, return empty string (no due date)
  if (paymentCount >= termNumber) {
    return "";
  }

  const startDate = new Date(activateDate);
  const currentDate = new Date();
  
  // Calculate expected payments based on time passed
  let expectedPayments = 0;
  
  if (type && type.toLowerCase() === "daily") {
    // For daily loans, calculate days since start
    const daysSinceStart = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    expectedPayments = Math.min(daysSinceStart, termNumber);
  } 
  else if (type && type.toLowerCase() === "weekly") {
    // For weekly loans, calculate weeks since start
    const weeksSinceStart = Math.floor((currentDate - startDate) / (7 * 24 * 60 * 60 * 1000));
    expectedPayments = Math.min(weeksSinceStart, termNumber);
  } 
  else {
    // For monthly loans (default), calculate months since start
    const monthsSinceStart = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                             currentDate.getMonth() - startDate.getMonth();
    expectedPayments = Math.min(monthsSinceStart, termNumber);
  }
  
  // Calculate overdue payments (expected minus actual)
  const overduePayments = Math.max(0, expectedPayments - paymentCount);
  
  // Return the number of overdue payments
  return overduePayments > 0 ? overduePayments.toString() : "";
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
