// app/api/loan-approval/route.js
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    // Create database connection
    const connection = await connectDB();

    try {
      // Get loan data from multiple tables - joining auto_loan_applications and loan_bussiness tables
      // const [autoLoanResults] = await connection.execute(`
      //   SELECT
      //     a.id,
      //     c.fullname as customerName,
      //     a.contractid,
      //     e.name as croName,
      //     a.loan_amount as revenueAmount,
      //     a.status,
      //     'Auto Loan' as loanType,
      //     DATE_FORMAT(a.created_at, '%b %d, %Y') as applicationDate
      //   FROM auto_loan_applications a
      //   JOIN customer c ON a.customer_id = c.id
      //   LEFT JOIN employees e ON a.CROid = e.id
      //   ORDER BY a.created_at DESC
      // `);

      const [businessLoanResults] = await connection.execute(`
        SELECT 
          b.id,
          c.fullname as customerName,
          b.contractid,
          e.name as croName,
          b.loanAmount as revenueAmount,
          b.status,
          b.loanType,
          DATE_FORMAT(b.addat, '%b %d, %Y') as applicationDate
        FROM loan_bussiness b
        JOIN customer c ON b.customerid = c.id
        LEFT JOIN employees e ON b.CROid = e.id
        ORDER BY b.addat DESC
      `);

      // Format auto loans
      // const formattedAutoLoans = autoLoanResults.map(loan => ({
      //   id: `A-${loan.id}`,
      //   customerName: loan.customerName,
      //   contractId: loan.contractid || `CT-${4590 + parseInt(loan.id)}`,
      //   croName: loan.croName || "Unassigned",
      //   revenueAmount: `LKR ${Number(loan.revenueAmount).toLocaleString()}`,
      //   status: loan.status === "fund waiting" ? "Waiting for Funds" :
      //           loan.status.charAt(0).toUpperCase() + loan.status.slice(1),
      //   loanType: "Auto Loan",
      //   applicationDate: loan.applicationDate
      // }));

      // Format business loans
      const formattedBusinessLoans = businessLoanResults.map((loan) => ({
        id: `B-${loan.id}`,
        customerName: loan.customerName,
        contractId: loan.contractid || `CT-${4590 + parseInt(loan.id)}`,
        croName: loan.croName || "Unassigned",
        revenueAmount: `LKR ${Number(loan.revenueAmount).toLocaleString()}`,
        status:
          loan.status === "fund waiting"
            ? "Waiting for Funds"
            : loan.status.charAt(0).toUpperCase() + loan.status.slice(1),
        loanType: loan.loanType,
        applicationDate: loan.applicationDate,
      }));

      // Combine all loan types
      const allLoans = [...formattedBusinessLoans];

      // Sort by most recent date
      allLoans.sort((a, b) => {
        const dateA = new Date(a.applicationDate);
        const dateB = new Date(b.applicationDate);
        return dateB - dateA;
      });

      return new Response(JSON.stringify({ success: true, data: allLoans }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error fetching loan approval data:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
