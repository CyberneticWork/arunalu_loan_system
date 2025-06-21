// app/api/loan-approval/update-status/route.js
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const requestData = await req.json();
    const { loanId, action } = requestData;

    if (!loanId || !action) {
      return new Response(
        JSON.stringify({ error: "Loan ID and action are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({
          error: "Invalid action. Must be 'approve' or 'reject'",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract loan type and ID
    const loanType = loanId.charAt(0);
    const id = loanId.substring(2);

    // Changed: Use 'fund waiting' status instead of 'active' when approving
    const status = action === "approve" ? "fund waiting" : "rejected";

    const connection = await connectDB();

    try {
      // Update the appropriate table based on the loan type
      if (loanType === "A") {
        // Auto loan
        await connection.execute(
          `UPDATE auto_loan_applications SET status = ? WHERE id = ?`,
          [status, id]
        );
      } else if (loanType === "B") {
        // Business loan
        await connection.execute(
          `UPDATE loan_bussiness SET status = ? WHERE id = ?`,
          [status, id]
        );
      } else {
        return new Response(JSON.stringify({ error: "Invalid loan type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (action === "approve") {
        const [loanResult] = await connection.execute(
          `SELECT * FROM loan_bussiness WHERE id = ?`,
          [id]
        );
        console.log(`Loan approved:`, loanResult[0]);
        const loanAmount = loanResult[0].loanAmount;
        const serviceCharge = loanResult[0].serviceCharge;
        const Totalpay = loanResult[0].Totalpay;

        // Calculate interest
        const interest = Totalpay - loanAmount;

        //insert to cashbook
        const [CashIn] = await connection.execute(
          `Insert into cashbook (amount, type,method, description,TotalInt,TotalLoan, created_at) values (?,?,?, ?, ?, ?, NOW())`,
          [
            loanAmount,
            "loan",
            "cash",
            `Loan approved: ${loanResult[0].loanType} (${loanResult[0].type})`,
            interest,
            loanAmount,
          ]
        );
        console.log(`Cashbook entry created:`, CashIn);
        //insert the service charge to cashbook
        const [ServiceCharge] = await connection.execute(
          `Insert into cashbook (amount, type, method, description, created_at) values (?, ?, ?, ?, NOW())`,
          [
            serviceCharge,
            "income",
            "cash",
            `Service charge for loan: ${loanResult[0].loanType} (${loanResult[0].type})`,
          ]
        );
        console.log(`Cashbook entry created:`, ServiceCharge);
        // Insert the interest to cashbook
        const [InterestEntry] = await connection.execute(
          `Insert into cashbook (amount, type, method, description, created_at) values (?, ?, ?, ?, NOW())`,
          [
            interest,
            "interest",
            "cash",
            `Interest for loan: ${loanResult[0].loanType} (${loanResult[0].type})`,
          ]
        );
        console.log(`Interest entry created:`, InterestEntry);
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: `Loan ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error(`Error updating loan status:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
