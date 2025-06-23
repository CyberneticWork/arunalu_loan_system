import { connectDB } from "@/lib/db";

export async function GET() {
  let connection;
  try {
    connection = await connectDB();

    // Get total overpayment (sum of positive balances from latest repayment per loan)
    const [overpaymentRows] = await connection.execute(`
      SELECT SUM(r.balance) as totalOverpayment
      FROM repayment r
      INNER JOIN (
        SELECT loan_bussiness_id, MAX(id) as max_id
        FROM repayment
        GROUP BY loan_bussiness_id
      ) latest ON r.loan_bussiness_id = latest.loan_bussiness_id AND r.id = latest.max_id
      WHERE r.balance > 0
    `);
    // Get total arrears (sum of negative balances from latest repayment per loan)
    const [arrearsRows] = await connection.execute(`
      SELECT SUM(r.balance) as totalArrears
      FROM repayment r
      INNER JOIN (
        SELECT loan_bussiness_id, MAX(id) as max_id
        FROM repayment
        GROUP BY loan_bussiness_id
      ) latest ON r.loan_bussiness_id = latest.loan_bussiness_id AND r.id = latest.max_id
      WHERE r.balance < 0
    `);

    return Response.json({
      code: "SUCCESS",
      totalOverpayment: overpaymentRows[0].totalOverpayment || 0,
      totalArrears: Math.abs(arrearsRows[0].totalArrears || 0),
    });
  } catch (error) {
    return Response.json(
      { code: "ERROR", message: "Failed to fetch summary" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}