import { connectDB } from "@/lib/db";

// GET /api/repayments/today
// Returns today's repayment transactions with customer contact and correctness (paid amount vs expected installment)
export async function GET() {
  let connection;
  try {
    connection = await connectDB();

    // Fetch today's repayment records joined with loan and customer to compute expected installment
    const [rows] = await connection.execute(
      `SELECT 
        r.id as repaymentId,
        r.transactionId,
        r.loan_bussiness_id as loanId,
        r.paid_amount as paidAmount,
        r.payment_method as paymentMethod,
        r.payment_date as createdAt,
        r.setalment as settlement,
        r.balance as balanceAfter,
        lb.customerid as customerId,
        lb.Totalpay as totalPay,
        lb.term as term,
        lb.loanType as loanType,
        lb.type as frequency,
        c.fullname as customerName,
        c.telno as phone
      FROM repayment r
      JOIN loan_bussiness lb ON lb.id = r.loan_bussiness_id
      JOIN customer c ON c.id = lb.customerid
      WHERE DATE(r.payment_date) = CURDATE()
      ORDER BY r.payment_date DESC`
    );

    // Compute correctness per row
    const data = rows.map((row) => {
      const perInstallment = row.term ? Number(row.totalPay) / Number(row.term) : 0;
      const paid = Number(row.paidAmount);
      // allow a tiny tolerance for cents/rounding
      const epsilon = 0.01;
      const isCorrect = Math.abs(paid - perInstallment) <= epsilon;
      const settlementVal = Number(row.settlement ?? 0);
      return {
        repaymentId: row.repaymentId,
        transactionId: row.transactionId,
        loanId: row.loanId,
        customerId: row.customerId,
        customerName: row.customerName,
        phone: row.phone,
        paidAmount: Number(paid.toFixed(2)),
        expectedInstallment: Number(perInstallment.toFixed(2)),
        // settlement (remaining balance) from DB column r.setalment
        settlement: Number(settlementVal.toFixed(2)),
        isCorrect,
        paymentMethod: row.paymentMethod,
        createdAt: row.createdAt,
        loanType: row.loanType,
        frequency: row.frequency,
        balanceAfter: Number((row.balanceAfter ?? 0))
      };
    });

    return Response.json({ code: "SUCCESS", data });
  } catch (error) {
    console.error("Error fetching today's repayments:", error);
    return Response.json({ code: "ERROR", message: "Failed to fetch today's repayments" }, { status: 500 });
  } finally {
    if (connection) {
      try { await connection.end(); } catch {}
    }
  }
}
