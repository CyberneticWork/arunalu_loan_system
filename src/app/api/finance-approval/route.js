// app/api/finance-approval/route.js
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    // Create database connection
    const connection = await connectDB();

    try {
      // Get auto loan data with flexible status matching
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
      //   WHERE LOWER(TRIM(a.status)) = 'fund waiting' OR 
      //         a.status = 'pending' OR
      //         a.status = 'active'
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
          b.type,
          b.location,
          b.gs,
          b.ds,
          DATE_FORMAT(b.addat, '%b %d, %Y') as applicationDate
        FROM loan_bussiness b
        JOIN customer c ON b.customerid = c.id
        LEFT JOIN employees e ON b.CROid = e.id
        WHERE b.status = 'fund waiting' OR 
              b.status = 'active' OR
              b.status = 'pending'
        ORDER BY b.addat DESC
      `);

      // Get equipment loans with flexible status matching
      // const [equipmentLoanResults] = await connection.execute(`
      //   SELECT 
      //     e.id,
      //     c.fullname as customerName,
      //     e.contractid,
      //     em.name as croName,
      //     e.loan_amount as revenueAmount,
      //     e.status,
      //     'Equipment Loan' as loanType,
      //     DATE_FORMAT(e.created_at, '%b %d, %Y') as applicationDate
      //   FROM equipment_loan_applications e
      //   JOIN customer c ON e.customer_id = c.id
      //   LEFT JOIN employees em ON e.CROid = em.id
      //   WHERE LOWER(TRIM(e.status)) = 'fund waiting' OR 
      //         e.status = 'pending' OR
      //         e.status = 'active'
      //   ORDER BY e.created_at DESC
      // `);

      // Format auto loans
      // const formattedAutoLoans = autoLoanResults.map(loan => ({
      //   id: `A-${loan.id}`,
      //   customerName: loan.customerName,
      //   contractId: loan.contractid || `CT-${4590 + parseInt(loan.id)}`,
      //   croName: loan.croName || "Unassigned",
      //   revenueAmount: `LKR ${Number(loan.revenueAmount).toLocaleString()}`,
      //   status: loan.status === 'active' ? "Approved" : "Waiting for Funds",
      //   loanType: "Auto Loan",
      //   applicationDate: loan.applicationDate
      // }));

      // Format business loans
      const formattedBusinessLoans = businessLoanResults.map(loan => ({
        id: `B-${loan.id}`,
        customerName: loan.customerName,
        contractId: loan.contractid || `CT-${4590 + parseInt(loan.id)}`,
        croName: loan.croName || "Unassigned",
        revenueAmount: `LKR ${Number(loan.revenueAmount).toLocaleString()}`,
        status: loan.status === 'active' ? "Approved" : "Waiting for Funds",
        loanType: loan.loanType ,
        type: loan.type,
        location: loan.location,
        gs: loan.gs,
        ds: loan.ds,
        applicationDate: loan.applicationDate
      }));

      // Format equipment loans
      // const formattedEquipmentLoans = equipmentLoanResults.map(loan => ({
      //   id: `E-${loan.id}`,
      //   customerName: loan.customerName,
      //   contractId: loan.contractid || `CT-${4590 + parseInt(loan.id)}`,
      //   croName: loan.croName || "Unassigned",
      //   revenueAmount: `LKR ${Number(loan.revenueAmount).toLocaleString()}`,
      //   status: loan.status === 'active' ? "Approved" : "Waiting for Funds",
      //   loanType: "Equipment Loan",
      //   applicationDate: loan.applicationDate
      // }));

      // Combine all loan types
      const allLoans = [ ...formattedBusinessLoans];
      
      // Sort by most recent date
      allLoans.sort((a, b) => {
        const dateA = new Date(a.applicationDate);
        const dateB = new Date(b.applicationDate);
        return dateB - dateA;
      });

      return new Response(
        JSON.stringify({ success: true, data: allLoans }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error fetching finance approval data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
