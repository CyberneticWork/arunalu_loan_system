import { connectDB } from "@/lib/db";

// Function to generate payment schedule
function generatePaymentSchedule(loanAmount, interestRate, loanTermMonths) {
  const monthlyInterestRate = interestRate / 100 / 12;
  const monthlyPayment =
    (loanAmount *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, loanTermMonths)) /
    (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

  const schedule = [];
  let remainingBalance = loanAmount;

  for (let month = 1; month <= loanTermMonths; month++) {
    const interestAmount = remainingBalance * monthlyInterestRate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingBalance -= principalAmount;

    schedule.push({
      paymentDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      paymentAmount: parseFloat(monthlyPayment.toFixed(2)),
      principalAmount: parseFloat(principalAmount.toFixed(2)),
      interestAmount: parseFloat(interestAmount.toFixed(2)),
      remainingBalance: parseFloat(remainingBalance.toFixed(2)),
    });
  }

  return schedule;
}

export async function POST(req) {
  try {
    const data = await req.json();

    // Validate required fields
    const requiredFields = [
      "customer_id",
      "equipment_price",
      "down_payment",
      "loan_amount",
      "loan_term_months",
      "interest_rate",
      "monthly_payment",
      "total_interest",
      "total_payable",
      "effective_rate",
      "client_receiving_amount",
    ];

    const missingFields = requiredFields.filter(
      (field) => data[field] === undefined
    );
    if (missingFields.length > 0) {
      return Response.json(
        {
          code: "ERROR",
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const connection = await connectDB();

    // Check if customer is blacklisted
    const [customerRows] = await connection.execute(
      "SELECT id, fullname, nic, isBlacklisted FROM customer WHERE id = ?",
      [data.customer_id]
    );

    if (customerRows.length === 0) {
      return Response.json(
        { code: "ERROR", message: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = customerRows[0];
    if (customer.isBlacklisted) {
      return Response.json(
        {
          code: "ERROR",
          message: `Cannot create equipment loan for blacklisted customer: ${customer.fullname} (NIC: ${customer.nic})`,
        },
        { status: 403 }
      );
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Check if required tables exist
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME IN ('equipment_loan_applications', 'initial_charges', 'payment_schedule', 'loan_payments')`
      );

      const requiredTables = [
        "equipment_loan_applications",
        "initial_charges",
        "payment_schedule",
        "loan_payments",
      ];
      const missingTables = requiredTables.filter(
        (table) => !tables.some((t) => t.TABLE_NAME === table)
      );

      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(", ")}`);
      }

      // Insert into equipment_loan_applications
      console.log(data);

      const [loanResult] = await connection.execute(
        `INSERT INTO equipment_loan_applications (
          customer_id, EQ_price, down_payment, trade_in_value, loan_amount,
          loan_term_months, interest_rate, monthly_payment, total_interest,
          total_payable, effective_rate, client_receiving_amount, status, CROid, Addby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.customer_id,
          data.equipment_price,
          data.down_payment,
          data.trade_in_value || 0,
          data.loan_amount,
          data.loan_term_months,
          data.interest_rate,
          data.monthly_payment,
          data.total_interest,
          data.total_payable,
          data.effective_rate,
          data.client_receiving_amount,
          "pending",
          data.CROid,
          data.Addby,
        ]
      );

      const loanId = loanResult.insertId;

      // Insert initial charges if present
      if (data.initial_charges) {
        await connection.execute(
          `INSERT INTO initial_charges (
            loan_id, service_charges, document_charges, insurance_premium,
            introducer_commission, other_charges, total_charges, charges_option
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loanId,
            data.initial_charges.service_charges,
            data.initial_charges.document_charges,
            data.initial_charges.insurance_premium,
            data.initial_charges.introducer_commission,
            data.initial_charges.other_charges,
            data.initial_charges.total_charges,
            data.initial_charges.charges_option,
          ]
        );
      }

      // Store payment schedule as JSON from client
      if (
        Array.isArray(data.payment_schedule) &&
        data.payment_schedule.length > 0
      ) {
        await connection.execute(
          "UPDATE equipment_loan_applications SET payment_schedule = ? WHERE id = ?",
          [JSON.stringify({ schedule: data.payment_schedule }), loanId]
        );
      }

      // Commit transaction
      await connection.commit();

      return Response.json({
        code: "SUCCESS",
        message: "Loan application created successfully",
        loan_id: loanId,
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("Error creating loan application:", error);
    return Response.json(
      {
        code: "ERROR",
        message: "Failed to create loan application",
      },
      { status: 500 }
    );
  }
}
