import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";

async function generateExcelReport(filters) {
  let connection;
  try {
    connection = await connectDB();

    // 1. Get cash and bank values from cashbook
    const [cashRows] = await connection.execute(`
    SELECT (
    SUM(CASE 
        WHEN (type = 'income' OR type = 'withdrawal') AND method = 'cash' 
        THEN amount 
        WHEN type = 'loan' AND method = 'cash'
        THEN -amount
        ELSE 0 
    END)
    - SUM(CASE 
        WHEN type = 'deposit' AND method = 'cash' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE
        WHEN type = 'expense' AND method = 'cash'
        THEN amount
        ELSE 0
    END)
  ) AS NetCashAmount
  FROM cashbook;
    `);

    const [bankRows] = await connection.execute(`
       SELECT (
    SUM(CASE 
        WHEN (type = 'income' OR type = 'withdrawal') AND method = 'bank' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE 
        WHEN type = 'deposit' AND method = 'bank' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE
        WHEN type = 'expense' AND method = 'bank'
        THEN amount
        ELSE 0
    END)
  ) AS NetBankAmount
  FROM cashbook;
    `);

    // 2. Get total interest from cashbook (if you store interest as TotalInt)
    const [interestRows] = await connection.execute(`
      SELECT SUM(TotalInt) as totalInterest FROM cashbook WHERE TotalInt IS NOT NULL

    `);

    const totalCash = cashRows[0].NetCashAmount || 0;
    const totalBank = bankRows[0].NetBankAmount || 0;
    const totalCapital = Number(totalCash) + Number(totalBank);
    const totalInterest = interestRows[0].totalInterest || 0;

    // Build query with filters - enhanced to get all needed fields
    let query = `
      SELECT 
        lb.*, 
        c.fullname as fullname,
        lb.group_name,
        COALESCE(r.paid_amount, 0) as paid_amount,
        COALESCE(r.TotInterest, 0) as interest_paid,
        COALESCE(r.paid_amount, 0) + COALESCE(r.TotInterest, 0) as total_paid,
        latest.balance,
        CASE 
          WHEN latest.balance < 0 THEN ABS(latest.balance)
          ELSE 0 
        END as arrears,
        CASE 
          WHEN latest.balance > 0 THEN latest.balance
          ELSE 0 
        END as over_payment,
        lb.last_payment as last_payment,
        lb.activate_date as activete_date,
        COUNT(rp.id) as payment_count,
        lb.Installment as installment,
        latest.paymentCount as latest_payment_count,
        CASE 
          WHEN (? IS NOT NULL AND ? IS NOT NULL AND lb.activate_date BETWEEN ? AND ?) THEN lb.serviceCharge 
          ELSE 0 
        END as filtered_service_charge
      FROM loan_bussiness lb
      LEFT JOIN customer c ON lb.customerid = c.id
      LEFT JOIN (
        SELECT 
          loan_bussiness_id, 
          SUM(paid_amount) as paid_amount,
          SUM(TotInterest) as TotInterest
        FROM repayment
        WHERE (? IS NULL OR ? IS NULL OR payment_date BETWEEN ? AND ?)
        GROUP BY loan_bussiness_id
      ) r ON r.loan_bussiness_id = lb.id
      LEFT JOIN repayment rp ON rp.loan_bussiness_id = lb.id
        AND (? IS NULL OR ? IS NULL OR rp.payment_date BETWEEN ? AND ?)
      LEFT JOIN (
        SELECT r1.*
        FROM repayment r1
        INNER JOIN (
          SELECT loan_bussiness_id, MAX(paymentCount) as max_payment
          FROM repayment
          WHERE (? IS NULL OR ? IS NULL OR payment_date BETWEEN ? AND ?)
          GROUP BY loan_bussiness_id
        ) r2 ON r1.loan_bussiness_id = r2.loan_bussiness_id AND r1.paymentCount = r2.max_payment
      ) latest ON latest.loan_bussiness_id = lb.id
      WHERE 1=1
        AND (? IS NULL OR ? IS NULL OR lb.last_payment BETWEEN ? AND ?)
    `;

    const queryParams = [];

    // Add date range parameters for all the subqueries and main WHERE clause
    if (filters.dateFrom && filters.dateTo) {
      const dateFrom = `${filters.dateFrom} 00:00:00`;
      const dateTo = `${filters.dateTo} 23:59:59`;
      // filtered_service_charge CASE on lb.activate_date
      queryParams.push(dateFrom, dateTo, dateFrom, dateTo);
      // r subquery
      queryParams.push(dateFrom, dateTo, dateFrom, dateTo);
      // rp join
      queryParams.push(dateFrom, dateTo, dateFrom, dateTo);
      // latest subquery (inner)
      queryParams.push(dateFrom, dateTo, dateFrom, dateTo);
      // main WHERE (lb.last_payment)
      queryParams.push(dateFrom, dateTo, dateFrom, dateTo);
    } else {
      // Push NULLs to satisfy placeholders (5 sets x 4 params)
      for (let i = 0; i < 5; i++) {
        queryParams.push(null, null, null, null);
      }
    }

    // Additional filters
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

    // Rearrange columns and modify row mapping:
    worksheet.columns = [
      { header: "Last Payment Date", key: "date", width: 12 },
      { header: "Loan issued Date", key: "issueddate", width: 12 },
      { header: "Customer Name", key: "fullname", width: 20 },
      { header: "Group", key: "group_name", width: 12 }, // <-- changed
      { header: "Center", key: "center", width: 12 },

      { header: "Loan Amount", key: "loanAmount", width: 12 },
      { header: "Loan Term", key: "term", width: 10 },
      { header: "Loan Installment", key: "loanInstallment", width: 15 },

      { header: "Service Charge", key: "serviceCharge", width: 12 },

      { header: "Total Outstanding", key: "outstanding", width: 12 },

      { header: "Paid Amount", key: "paidAmount", width: 12 },

      { header: "Total Capital", key: "totalCapital", width: 12 },

      { header: "Total Interest", key: "totalInterest", width: 12 },

      { header: "Oustanding Interest", key: "interestIncome", width: 12 },

      { header: "Paid Interest Income", key: "paidInterestIncome", width: 12 },

      { header: "Arrears", key: "arrears", width: 12 },

      { header: "Over Payment", key: "overPayment", width: 12 },

      { header: "Due Date", key: "dueDate", width: 12 },
    ];

    // Format database rows to match expected structure with clearer mapping
    const formattedData = rows.map((row) => {
      // 1. date = lb.addat
      const dateValue = row.last_payment
        ? new Date(row.last_payment).toLocaleDateString("en-CA") // Uses YYYY-MM-DD format without timezone offset
        : "";
      console.log("Raw last_payment:", row.last_payment);
      // 1. issueddate = lb.activate_date
      const issuedDateValue = row.activate_date
        ? new Date(row.activate_date).toISOString().split("T")[0]
        : "";
      console.log("Raw activate_date:", row.activate_date);
      // 2. center = lb.location
      const centerValue = row.gs || "";

      // 3. group = lb.loanTypeMode
      const groupValue = row.group_name
        ? `group(${row.group_name})`
        : row.loanTypeMode === "group"
        ? "group"
        : "normal";

      // 4. fullname = c.fullname
      const customerName = row.fullname || "";

      // 5. loanAmount = lb.loanAmount
      const loanAmount = row.loanAmount || 0;

      // 6. loanInstallment = lb.Totalpay / lb.term
      let installmentVal = 0;
      if (row.Totalpay && row.term) {
        const termNumber = parseFloat(row.term) || 1;
        installmentVal = parseFloat(row.Totalpay) / termNumber;
      }

      // 7. serviceCharge = filtered_service_charge (only if paid within selected date range)
      const serviceChargeVal = row.filtered_service_charge || 0;

      // 8. totalOutstanding = like printPreview.jsx "Outstanding"
      //   (example) = row.Totalpay - row.paid_amount
      const totalOutstandingVal = (row.Totalpay || 0) - (row.paid_amount || 0);

      // 9. paidAmount = from repayment with highest paymentCount

      const paidAmountVal = row.paid_amount || 0;

      // Calculate principal paid and interest paid
      const principalPaid = row.paid_amount || 0;
      const interestPaid = row.interest_paid || 0;

      // Calculate total capital (remaining principal)
      const totalCapitalVal =
        (row.loanAmount || 0) - (row.paid_amount - row.interest_paid || 0);

      // Calculate total interest (do not subtract paid interest)
      const totalInterestVal = (row.Totalpay || 0) - (row.loanAmount || 0);

      // Interest Income (Outstanding Interest): total interest - paid interest
      const interestIncomeVal = totalInterestVal - (row.interest_paid || 0);

      // 13. paidInterestIncome = sum of TotInterest in cashbook
      const paidInterestIncomeVal = row.interest_paid || 0;

      // 14. arrears = get from the latest payment (with maximum paymentCount)
      const arrearsVal = row.arrears || 0;

      // 15. overPayment = get from the latest payment (with maximum paymentCount)
      const overPaymentVal = row.over_payment || 0;

      // 16. loanTerm = lb.term
      const termVal = row.term || "";

      // 17. dueDate = days between last payment and today
      let dueDateVal = "";

      if (row.last_payment) {
        // Calculate due date based on last_payment column
        const lastPaymentDate = new Date(row.last_payment);
        const today = new Date();

        // Calculate days difference based on loan type
        if (row.type && row.type.toLowerCase() === "daily") {
          const daysDiff = Math.floor(
            (today - lastPaymentDate) / (1000 * 60 * 60 * 24)
          );
          dueDateVal = daysDiff > 0 ? daysDiff.toString() : "";
        } else if (row.type && row.type.toLowerCase() === "weekly") {
          const daysDiff = Math.floor(
            (today - lastPaymentDate) / (1000 * 60 * 60 * 24)
          );
          const weeksDiff = Math.floor(daysDiff / 7);
          dueDateVal = weeksDiff > 0 ? weeksDiff.toString() : "";
        } else {
          // Monthly
          const months =
            (today.getFullYear() - lastPaymentDate.getFullYear()) * 12 +
            (today.getMonth() - lastPaymentDate.getMonth());
          dueDateVal = months > 0 ? months.toString() : "";
        }
      } else if (row.activate_date) {
        // If no last_payment recorded, use activate_date
        const activateDate = new Date(row.activate_date);
        const today = new Date();

        // Calculate based on loan type
        if (row.type && row.type.toLowerCase() === "daily") {
          const daysSinceActivation = Math.floor(
            (today - activateDate) / (1000 * 60 * 60 * 24)
          );
          dueDateVal =
            daysSinceActivation > 0 ? daysSinceActivation.toString() : "";
        } else if (row.type && row.type.toLowerCase() === "weekly") {
          const daysSinceActivation = Math.floor(
            (today - activateDate) / (1000 * 60 * 60 * 24)
          );
          const weeksSinceActivation = Math.floor(daysSinceActivation / 7);
          dueDateVal =
            weeksSinceActivation > 0 ? weeksSinceActivation.toString() : "";
        } else {
          // Monthly
          const months =
            (today.getFullYear() - activateDate.getFullYear()) * 12 +
            (today.getMonth() - activateDate.getMonth());
          dueDateVal = months > 0 ? months.toString() : "";
        }
      }

      return {
        date: dateValue,

        issueddate: issuedDateValue,
        center: centerValue,
        group_name: groupValue, // <-- changed
        fullname: customerName,
        loanAmount: loanAmount,
        loanInstallment: installmentVal,
        serviceCharge: serviceChargeVal,
        outstanding: totalOutstandingVal,
        paidAmount: paidAmountVal,
        totalCapital: totalCapitalVal,
        totalInterest: totalInterestVal,
        interestIncome: interestIncomeVal,
        paidInterestIncome: paidInterestIncomeVal,
        arrears: arrearsVal,
        overPayment: overPaymentVal,
        term: termVal,
        dueDate: dueDateVal,
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
    const daysSinceStart = Math.floor(
      (currentDate - startDate) / (24 * 60 * 60 * 1000)
    );
    expectedPayments = Math.min(daysSinceStart, termNumber);
  } else if (type && type.toLowerCase() === "weekly") {
    // For weekly loans, calculate weeks since start
    const weeksSinceStart = Math.floor(
      (currentDate - startDate) / (7 * 24 * 60 * 60 * 1000)
    );
    expectedPayments = Math.min(weeksSinceStart, termNumber);
  } else {
    // For monthly loans (default), calculate months since start
    const monthsSinceStart =
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
      currentDate.getMonth() -
      startDate.getMonth();
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
