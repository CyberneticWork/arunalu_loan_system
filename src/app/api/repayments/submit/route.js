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
      const totalPaidAmount = previousPaidAmount + newPaidAmount;

      // Get loan details for calculations
      const [loanDetails] = await connection.execute(
        `SELECT loanAmount, term, Totalpay 
          FROM loan_bussiness 
          WHERE id = ?`,
        [payment.loanId]
      );

      if (loanDetails.length === 0) {
        throw new Error(`Loan with ID ${payment.loanId} not found`);
      }

      const loanAmountFromDB = parseFloat(loanDetails[0].loanAmount);
      const termFromDB = parseInt(loanDetails[0].term);
      const totalPayFromDB = parseFloat(loanDetails[0].Totalpay);

      // Now you can safely use totalPayFromDB
      let overpayment = 0;
      if (totalPaidAmount > totalPayFromDB) {
        overpayment = totalPaidAmount - totalPayFromDB;
      }

      // Calculate how much principal and interest already paid
      const [prevRepayments] = await connection.execute(
        `SELECT COALESCE(SUM(loan_amount),0) as paidPrincipal, COALESCE(SUM(TotInterest),0) as paidInterest FROM repayment WHERE loan_bussiness_id = ?`,
        [payment.loanId]
      );
      let principalLeft = loanAmountFromDB - parseFloat(prevRepayments[0].paidPrincipal || 0);
      let interestLeft = (totalPayFromDB - loanAmountFromDB) - parseFloat(prevRepayments[0].paidInterest || 0);

      // --- PROPORTIONAL SPLIT LOGIC ---
      // Per installment
      const perInstallment = totalPayFromDB / termFromDB;
      const perInstallmentPrincipal = loanAmountFromDB / termFromDB;
      const perInstallmentInterest = (totalPayFromDB - loanAmountFromDB) / termFromDB;

      // Proportional split for this payment
      let principalPaid = 0;
      let interestPaid = 0;
      if (principalLeft <= 0 && interestLeft <= 0) {
        principalPaid = 0;
        interestPaid = 0;
      } else {
        // Calculate how much of this payment goes to principal and interest
        // If payment is more than remaining, cap at remaining
        let maxPrincipal = Math.min(principalLeft, newPaidAmount * (perInstallmentPrincipal / perInstallment));
        let maxInterest = Math.min(interestLeft, newPaidAmount * (perInstallmentInterest / perInstallment));
        // If payment is more than remaining total, adjust last payment
        if (newPaidAmount >= (principalLeft + interestLeft)) {
          principalPaid = principalLeft;
          interestPaid = interestLeft;
        } else {
          principalPaid = maxPrincipal;
          interestPaid = maxInterest;
        }
      }

      // Calculate remaining amount
      let remainingAmount = (totalPayFromDB - (parseFloat(prevRepayments[0].paidPrincipal) + parseFloat(prevRepayments[0].paidInterest) + newPaidAmount));
      if (remainingAmount < 0) remainingAmount = 0;

      const status = remainingAmount <= 0 ? "completed" : "pending";

      // Calculate expected installment
      const expectedInstallment = perInstallment;

      // Calculate overpayment/underpayment for balance tracking
      let previousBalance = 0;
      const [lastRepayment] = await connection.execute(
        `SELECT balance FROM repayment WHERE loan_bussiness_id = ? ORDER BY id DESC LIMIT 1`,
        [payment.loanId]
      );
      if (lastRepayment.length > 0) {
        previousBalance = parseFloat(lastRepayment[0].balance);
      }
      // Calculate new balance for this repayment (for arrears/overpayment tracking)
      let newBalance = 0;
      if (totalPaidAmount >= totalPayFromDB) {
        // Loan is fully paid, no overpayment should be tracked
        newBalance = 0;
      } else {
        // Not fully paid, track running balance
        newBalance = previousBalance + (newPaidAmount - expectedInstallment);
      }

      // Insert the payment record with correct principal and interest
      const [result] = await connection.execute(
        `INSERT INTO repayment (
          loan_bussiness_id,
          paymentCount,
          loan_amount,
          full_loan_amount,
          paid_amount,
          payment_method,
          setalment,
          balance,
          status,
          TotInterest
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.loanId,
          paymentCount,
          principalPaid.toFixed(2),
          totalPayFromDB.toFixed(2),
          newPaidAmount.toFixed(2),
          payment.paymentMethod,
          remainingAmount.toFixed(2),
          newBalance.toFixed(2),
          status,
          interestPaid.toFixed(2)
        ]
      );

      // Optionally, update loan_bussiness.credit_balance
      await connection.execute(
        `UPDATE loan_bussiness SET credit_balance = ? WHERE id = ?`,
        [newBalance.toFixed(2), payment.loanId]
      );

      // Get the generated transaction ID
      const [transactionResult] = await connection.execute(
        "SELECT transactionId  FROM repayment WHERE id = ?",
        [result.insertId]
      );
      const transactionId = transactionResult[0]?.transactionId || "";

      // Add income transaction to cashbook
      await connection.execute(
        `INSERT INTO cashbook (
          description,
          type,
          amount,
          category,
          method,
          TotInterest,
          TotOutstanding,
          NetAmount,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())`,
        [
          `Loan Repayment - ${transactionId}`,
          "income",
          newPaidAmount.toFixed(2),
          "Loan Repayment",
          payment.paymentMethod.toLowerCase(),
          interestPaid.toFixed(2),
          principalPaid.toFixed(2),
          newPaidAmount.toFixed(2),
        ]
      );

      // For loan value deduction (principal only)
      if (principalPaid > 0) {
        await connection.execute(
          `INSERT INTO cashbook (
            description,
            type,
            amount,
            category,
            method,
            TotalInt,
            TotalLoan,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())`,
          [
            `Loan Value Deduction - ${transactionId}`,
            "loan-deduction",
            principalPaid.toFixed(2),
            "Loan Value Adjustment",
            "bank",
            0,
            principalPaid.toFixed(2),
          ]
        );
      }

      // For interest value deduction (interest only)
      if (interestPaid > 0) {
        await connection.execute(
          `INSERT INTO cashbook (
            description,
            type,
            amount,
            category,
            method,
            TotalInt,
            TotalLoan,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())`,
          [
            `Interest Value Deduction - ${transactionId}`,
            "interest-deduction",
            interestPaid.toFixed(2),
            "Interest Value Adjustment",
            "bank",
            interestPaid.toFixed(2),
            0,
          ]
        );
      }

      // If payment completed, update loan_bussiness status
      if (status === "completed") {
        await connection.execute(
          `UPDATE loan_bussiness 
           SET status = 'completed' 
           WHERE id = ?`,
          [payment.loanId]
        );
      }

      results.push({
        success: true,
        transactionId: transactionId,
        paymentId: result.insertId,
        remainingAmount: remainingAmount.toFixed(2),
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
