import { connectDB } from "@/lib/db";

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
        c.fullname as customerName,
        c.gs,
        c.ds,
        c.location,
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
        ) as remainingAmount
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
        remainingAmount: Number(row.remainingAmount || row.Totalpay)
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
