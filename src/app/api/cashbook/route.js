import { connectDB } from "@/lib/db";

export async function GET() {
  let connection;
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
