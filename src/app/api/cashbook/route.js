import { connectDB } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!action) {
    return new Response(JSON.stringify({ error: "Action is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  let connection;
  if (
    action !== "getAll" &&
    action !== "getTodayExpenses" &&
    action !== "getTotalLoanCash"
  ) {
    return new Response(JSON.stringify({ error: "Invalid action specified" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (action === "getTodayExpenses") {
    try {
      connection = await connectDB();
      const [rows] = await connection.execute(`
      SELECT SUM(amount) AS TotalAmount FROM cashbook WHERE type = 'expense' AND DATE(created_at) = CURDATE();
    `);
      await connection.end();

      return new Response(JSON.stringify({ code: "SUCCESS", data: rows }), {
        status: 200,
      });
    } catch (error) {
      if (connection) await connection.end();
      return new Response(
        JSON.stringify({ code: "ERROR", message: error.message }),
        { status: 500 }
      );
    }
  } else if (action === "getAll") {
    try {
      connection = await connectDB();
      const [rows] = await connection.execute(`
      SELECT 
        id, 
        description, 
        type, 
        category, 
        method, 
        amount, 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date 
      FROM cashbook 
      ORDER BY created_at DESC;
    `);
      const [TotalCash] = await connection.execute(`
  SELECT (
    SUM(CASE 
        WHEN (type = 'income' OR type = 'withdrawal') AND method = 'cash' 
        THEN amount 
        WHEN type = 'loan' AND method = 'cash'
        THEN -amount
        ELSE 0 
    END)
    - SUM(CASE 
        WHEN type = 'deposit' AND method = 'cash' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE
        WHEN type = 'expense' AND method = 'cash'
        THEN amount
        ELSE 0
    END)
  ) AS NetCashAmount
  FROM cashbook;
`);

      const [TotalBank] = await connection.execute(`
  SELECT (
    SUM(CASE 
        WHEN (type = 'income' OR type = 'withdrawal') AND method = 'bank' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE 
        WHEN type = 'deposit' AND method = 'bank' 
        THEN amount 
        ELSE 0 
    END)
    - SUM(CASE
        WHEN type = 'expense' AND method = 'bank'
        THEN amount
        ELSE 0
    END)
  ) AS NetBankAmount
  FROM cashbook;

    `);

      // Update the TotalOutstanding query to handle loan-deduction
      const [TotalOutstanding] = await connection.execute(`
  SELECT SUM(
    CASE 
      WHEN type = 'loan' THEN TotalLoan
      WHEN type = 'loan-deduction' THEN -TotalLoan
      ELSE 0 
    END
  ) AS totalLoanValue 
  FROM cashbook 
  WHERE type IN ('loan', 'loan-deduction')
`);

      // Update the TotalIncomeInterest query to handle interest-deduction
      const [TotalIncomeInterest] = await connection.execute(`
  SELECT SUM(
    CASE 
      WHEN type = 'loan' THEN TotalInt
      WHEN type = 'interest-deduction' THEN -TotalInt
      ELSE 0 
    END
  ) AS totalInterestValue 
  FROM cashbook 
  WHERE type IN ('loan', 'interest-deduction')
`);
      //console log need to show netbank and netcash amount
      // console.log("eshan", TotalCash[0]);
      // console.log("eshan", TotalBank[0]);
      await connection.end();

      return new Response(
        JSON.stringify({
          code: "SUCCESS",
          data: rows,
          TotalCash: TotalCash[0].NetCashAmount,
          TotalBank: TotalBank[0].NetBankAmount,
          TotalOutstanding: TotalOutstanding[0].totalLoanValue,
          TotalIncomeInterest: TotalIncomeInterest[0].totalInterestValue,
        }),
        {
          status: 200,
        }
      );
    } catch (error) {
      if (connection) await connection.end();
      return new Response(
        JSON.stringify({ code: "ERROR", message: error.message }),
        { status: 500 }
      );
    }
  } else if (action === "getTotalLoanCash") {
    try {
      connection = await connectDB();
      const [rows] = await connection.execute(`
      SELECT SUM(amount) AS total_loan_cash FROM cashbook WHERE type = 'loan' AND method = 'cash';
    `);
      await connection.end();

      return new Response(JSON.stringify({ code: "SUCCESS", data: rows }), {
        status: 200,
      });
    } catch (error) {
      if (connection) await connection.end();
      return new Response(
        JSON.stringify({ code: "ERROR", message: error.message }),
        { status: 500 }
      );
    }
  }
}
export async function POST(req) {
  let connection;
  try {
    const data = await req.json();
    const { description, type, category, method, amount } = data;
    connection = await connectDB();
    const [result] = await connection.execute(
      `
            INSERT INTO cashbook (description, type, category, method, amount) 
            VALUES (?, ?, ?, ?, ?)
        `,
      [description, type, category, method, amount]
    );
    await connection.end();

    return new Response(
      JSON.stringify({
        code: "SUCCESS",
        message: "Transaction added successfully",
        id: result.insertId,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (connection) await connection.end();
    return new Response(
      JSON.stringify({ code: "ERROR", message: error.message }),
      { status: 500 }
    );
  }
}
