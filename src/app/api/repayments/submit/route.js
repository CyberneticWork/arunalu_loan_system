import { connectDB } from "@/lib/db";

export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { payments } = body;

    connection = await connectDB();
    await connection.beginTransaction();

    const results = [];

    for (const payment of payments) {
      // Get current payment count for this loan
      const [countResult] = await connection.execute(
        "SELECT COUNT(*) as count FROM repayment WHERE loan_bussiness_id = ?",
        [payment.loanId]
      );
      const paymentCount = countResult[0].count + 1;

      // Insert the payment record
      const [result] = await connection.execute(
        `INSERT INTO repayment (
          loan_bussiness_id,
          paymentCount,
          loan_amount,
          full_loan_amount,
          paid_amount,
          payment_method,
          setalment,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.loanId,
          paymentCount,
          payment.loanAmount,
          payment.fullLoanAmount,
          payment.paidAmount,
          payment.paymentMethod,
          payment.setalment,
          "completed",
        ]
      );

      // Get the generated transaction ID
      const [transactionResult] = await connection.execute(
        "SELECT transactionId FROM repayment WHERE id = ?",
        [result.insertId]
      );

      results.push({
        success: true,
        transactionId: transactionResult[0].transactionId,
        paymentId: result.insertId,
      });
    }

    await connection.commit();

    return Response.json({
      code: "SUCCESS",
      data: results,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error submitting payments:", error);
    return Response.json(
      {
        code: "ERROR",
        message: "Failed to submit payments",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
