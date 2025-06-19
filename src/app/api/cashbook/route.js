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
  if (action !== "getAll" && action !== "getTodayExpenses") {
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
  } else {
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
      ORDER BY created_at DESC
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
