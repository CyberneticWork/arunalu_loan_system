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
      // Get current payment count and total paid amount for this loan
      const [countResult] = await connection.execute(
        `SELECT 
          COUNT(*) as count,
          COALESCE(SUM(paid_amount), 0) as totalPaid 
        FROM repayment 
        WHERE loan_bussiness_id = ?`,
        [payment.loanId]
      );

      const paymentCount = countResult[0].count + 1;
      const previousPaidAmount = parseFloat(countResult[0].totalPaid || 0);
      const newPaidAmount = parseFloat(payment.paidAmount);
      const totalPaidAmount = (previousPaidAmount + newPaidAmount).toFixed(2);

      // Calculate remaining amount
      const remainingAmount = (
        parseFloat(payment.fullLoanAmount) - 
        parseFloat(totalPaidAmount)
      ).toFixed(2);
      
      const status = parseFloat(remainingAmount) <= 0 ? "completed" : "pending";

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
          newPaidAmount.toFixed(2),
          payment.paymentMethod,
          remainingAmount,
          status
        ]
      );

      // If payment completed, update loan_bussiness status
      if (status === "completed") {
        await connection.execute(
          `UPDATE loan_bussiness 
           SET status = 'completed' 
           WHERE id = ?`,
          [payment.loanId]
        );
      }

      // Get the generated transaction ID
      const [transactionResult] = await connection.execute(
        "SELECT transactionId FROM repayment WHERE id = ?",
        [result.insertId]
      );
      
      const transactionId = transactionResult[0].transactionId;
      
      // Add transaction to cashbook
      await connection.execute(
        `INSERT INTO cashbook (
          description,
          type,
          amount,
          category,
          method,
          created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP())`,
        [
          `Loan Repayment - ${transactionId}`,
          "income",
          newPaidAmount.toFixed(2),
          "Loan Repayment",
          payment.paymentMethod.toLowerCase(), // Convert to lowercase to match 'cash' or 'bank'
        ]
      );

      results.push({
        success: true,
        transactionId: transactionId,
        paymentId: result.insertId,
        remainingAmount,
        status,
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
