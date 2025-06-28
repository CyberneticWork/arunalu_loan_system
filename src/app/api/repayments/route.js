import { connectDB } from "@/lib/db";

// Helper function to calculate due days (matches export-excel logic)
function calculateDueDays(lastPayment, activateDate, type) {
  const today = new Date();
  let dueDateVal = "";

  if (lastPayment) {
    const lastPaymentDate = new Date(lastPayment);

    if (type && type.toLowerCase() === "daily") {
      const daysDiff = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
      dueDateVal = daysDiff > 0 ? daysDiff.toString() : "";
    } else if (type && type.toLowerCase() === "weekly") {
      const daysDiff = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      dueDateVal = weeksDiff > 0 ? weeksDiff.toString() : "";
    } else {
      // Monthly
      const months =
        (today.getFullYear() - lastPaymentDate.getFullYear()) * 12 +
        (today.getMonth() - lastPaymentDate.getMonth());
      dueDateVal = months > 0 ? months.toString() : "";
    }
  } else if (activateDate) {
    const activate = new Date(activateDate);

    if (type && type.toLowerCase() === "daily") {
      const daysSinceActivation = Math.floor((today - activate) / (1000 * 60 * 60 * 24));
      dueDateVal = daysSinceActivation > 0 ? daysSinceActivation.toString() : "";
    } else if (type && type.toLowerCase() === "weekly") {
      const daysSinceActivation = Math.floor((today - activate) / (1000 * 60 * 60 * 24));
      const weeksSinceActivation = Math.floor(daysSinceActivation / 7);
      dueDateVal = weeksSinceActivation > 0 ? weeksSinceActivation.toString() : "";
    } else {
      // Monthly
      const months =
        (today.getFullYear() - activate.getFullYear()) * 12 +
        (today.getMonth() - activate.getMonth());
      dueDateVal = months > 0 ? months.toString() : "";
    }
  }
  return dueDateVal;
}

export async function GET() {
  let connection;
  try {
    connection = await connectDB();

    const [rows] = await connection.execute(`
      SELECT 
        lb.id,
        lb.customerid,
        c.telno,
        lb.loanTypeMode,
        lb.loanType,
        lb.type,
        lb.Totalpay,
        lb.status,
        lb.group_name, 
        lb.rate,
        c.fullname as customerName,
        c.gs,
        c.ds,
        c.location,
        lb.term,
        lb.activate_date,
        lb.last_payment,
        (
          SELECT COUNT(*) FROM repayment r WHERE r.loan_bussiness_id = lb.id
        ) as paymentCount,
        CASE
          WHEN lb.type = 'daily' THEN CONCAT(lb.loanType, ' (Daily)')
          WHEN lb.type = 'weekly' THEN CONCAT(lb.loanType, ' (Weekly)')
          WHEN lb.type = 'monthly' THEN CONCAT(lb.loanType, ' (Monthly)')
          ELSE lb.loanType
        END as formattedLoanType,
        COALESCE(
          (SELECT lb.Totalpay - SUM(r.paid_amount)
           FROM repayment r 
           WHERE r.loan_bussiness_id = lb.id),
          lb.Totalpay
        ) as remainingAmount,
        COALESCE((
          SELECT r.balance
          FROM repayment r
          WHERE r.loan_bussiness_id = lb.id
          ORDER BY r.id DESC
          LIMIT 1
        ), 0) as balance
      FROM loan_bussiness lb
      JOIN customer c ON lb.customerid = c.id
      WHERE lb.status = 'active'
      ORDER BY lb.addat DESC
    `);

    return Response.json({
      code: "SUCCESS",
      data: rows.map((row) => ({
        ...row,
        loanType: row.formattedLoanType,
        remainingAmount: Number(row.remainingAmount || row.Totalpay),
        arrears: Number(row.balance) < 0 ? Math.abs(Number(row.balance)) : 0,
        overpayment: Number(row.balance) > 0 ? Number(row.balance) : 0,
        dueDays: calculateDueDays(
          row.last_payment,
          row.activate_date,
          row.type
        ),
      })),
    });
  } catch (error) {
    console.error("Error fetching repayments:", error);
    return Response.json(
      {
        code: "ERROR",
        message: "Failed to fetch repayments",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}
