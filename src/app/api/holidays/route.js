import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Fetch holidays (default to active only, but allow filtering)
export async function GET(request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "active";
  try {
    const connection = await connectDB();
    let query;
    let params = [];

    if (status === "all") {
      query = `
        SELECT 
          id,
          DATE_FORMAT(date, '%Y-%m-%d') AS date,
          name,
          type,
          description,
          created_at,
          updated_at,
          status
        FROM holidays
        ORDER BY date ASC
      `;
    } else {
      query = `
        SELECT 
          id,
          DATE_FORMAT(date, '%Y-%m-%d') AS date,
          name,
          type,
          description,
          created_at,
          updated_at,
          status
        FROM holidays
        WHERE status = ?
        ORDER BY date ASC
      `;
      params = [status];
    }

    const [rows] = await connection.execute(query, params);
    await connection.end();
    return new Response(JSON.stringify({ success: true, data: rows }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}

// POST: Create a new holiday (default to active)
export async function POST(req) {
  try {
    const { date, name, type, description, status } = await req.json();
    const connection = await connectDB();
    const [result] = await connection.execute(
      "INSERT INTO holidays (date, name, type, description, status) VALUES (?, ?, ?, ?, ?)",
      [date, name, type || "public", description || "", status || "active"]
    );
    await connection.end();
    return new Response(
      JSON.stringify({ success: true, id: result.insertId }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}

// PUT: Update an existing holiday (e.g., change status)
export async function PUT(req) {
  try {
    const { id, date, name, type, description, status } = await req.json();
    const connection = await connectDB();
    const [result] = await connection.execute(
      "UPDATE holidays SET date = ?, name = ?, type = ?, description = ?, status = ? WHERE id = ?",
      [date, name, type, description, status, id]
    );
    await connection.end();
    return new Response(
      JSON.stringify({ success: true, affectedRows: result.affectedRows }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}

// DELETE: Soft delete by setting status to inactive (or hard delete if preferred)
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const connection = await connectDB();
    const [result] = await connection.execute(
      "UPDATE holidays SET status = 'inactive' WHERE id = ?",
      [id]
    );
    await connection.end();
    return new Response(
      JSON.stringify({ success: true, affectedRows: result.affectedRows }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
