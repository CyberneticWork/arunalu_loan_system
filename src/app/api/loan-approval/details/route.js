// app/api/loan-approval/details/route.js
import { connectDB } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const loanId = searchParams.get("id");

    if (!loanId) {
      return new Response(JSON.stringify({ error: "Loan ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract loan type and ID
    const loanType = loanId.charAt(0);
    const id = loanId.substring(2);

    const connection = await connectDB();

    try {
      let loanDetails = null;
      let customerDetails = null;
      let additionalDetails = null;

      // Fetch loan and customer data based on loan type
      if (loanType === "A") {
        // Auto loan
        const [loanResult] = await connection.execute(
          `SELECT * FROM auto_loan_applications WHERE id = ?`,
          [id]
        );

        if (loanResult.length === 0) {
          return new Response(
            JSON.stringify({ error: "Auto loan not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        loanDetails = loanResult[0];

        // Get customer details
        const [customerResult] = await connection.execute(
          `SELECT * FROM customer WHERE id = ?`,
          [loanDetails.customer_id]
        );

        if (customerResult.length > 0) {
          customerDetails = customerResult[0];
        }

        // Get vehicle details if available
        const [vehicleResult] = await connection.execute(
          `SELECT * FROM vehicle_details WHERE loanid = ?`,
          [id]
        );

        if (vehicleResult.length > 0) {
          additionalDetails = {
            vehicleDetails: vehicleResult[0],
          };
        }
      } else if (loanType === "B") {
        // Business loan
        const [loanResult] = await connection.execute(
          `SELECT * FROM loan_bussiness WHERE id = ?`,
          [id]
        );

        if (loanResult.length === 0) {
          return new Response(
            JSON.stringify({ error: "Business loan not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        loanDetails = loanResult[0];

        // Get customer details
        const [customerResult] = await connection.execute(
          `SELECT * FROM customer WHERE id = ?`,
          [loanDetails.customerid]
        );

        if (customerResult.length > 0) {
          customerDetails = customerResult[0];
        }

        // Get business details if available
        const [businessResult] = await connection.execute(
          `SELECT * FROM businessdetails WHERE loandid = ?`,
          [id]
        );

        if (businessResult.length > 0) {
          additionalDetails = {
            businessDetails: businessResult[0],
          };
        }

        // Get financial details if available
        const [financialResult] = await connection.execute(
          `SELECT * FROM financialdetails WHERE loandid = ?`,
          [id]
        );

        if (financialResult.length > 0) {
          additionalDetails = {
            ...additionalDetails,
            financialDetails: financialResult[0],
          };
        }
      } else {
        return new Response(JSON.stringify({ error: "Invalid loan type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      let btnStatus = true;
      const [cashStatus] = await connection.execute(
        `SELECT SUM(CASE WHEN type IN ('income', 'withdrawal') THEN amount WHEN type IN ('deposit', 'expense') THEN -amount ELSE 0 END) AS totalBalance FROM cashbook WHERE method = 'cash';`
      );
      // console.log("Cash Status:", cashStatus[0].totalBalance);
      if (cashStatus[0].totalBalance >= loanDetails.Totalpay) {
        btnStatus = false;
      }
      // Format response
      const response = {
        success: true,
        data: {
          loan: loanDetails,
          customer: customerDetails
            ? {
                id: customerDetails.id,
                fullName: customerDetails.fullname,
                prefix: customerDetails.prefix,
                nic: customerDetails.nic,
                gender: customerDetails.gender === 1 ? "Male" : "Female",
                dob: customerDetails.dob,
                telNo: customerDetails.telno,
                address: customerDetails.address,
                gs: customerDetails.gs,
                ds: customerDetails.ds,
                district: customerDetails.district,
                province: customerDetails.province,
              }
            : null,
          additionalDetails,
          btnStatus: btnStatus,
        },
      };
      // console.log("Loan details fetched successfully:", response);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error fetching loan details:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
