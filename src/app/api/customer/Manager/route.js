import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    const db = await connectDB();
    const [rows] = await db.execute(
      "SELECT id, name FROM employees WHERE roll = ?",
      ["Manager"]
    );
    return NextResponse.json({
      code: "SUCCESS",
      data: rows,
    });
  } catch (error) {
    return NextResponse.json(
      { code: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}