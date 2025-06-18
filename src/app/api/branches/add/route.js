import { connectDB } from "@/lib/db";

// Insert branch
export async function POST(req) {
  try {
    const { branch, shortcode } = await req.json();
    if (!branch || !shortcode) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }
    const db = await connectDB();
    await db.query(
      "INSERT INTO branches (branch, shortcode) VALUES (?, ?)",
      [branch, shortcode]
    );
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Edit branch
export async function PUT(req) {
  try {
    const { id, branch, shortcode } = await req.json();
    if (!id || !branch || !shortcode) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }
    const db = await connectDB();
    await db.query(
      "UPDATE branches SET branch = ?, shortcode = ? WHERE id = ?",
      [branch, shortcode, id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Delete branch
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
    }
    const db = await connectDB();
    await db.query("DELETE FROM branches WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Get all branches
export async function GET() {
  try {
    const db = await connectDB();
    const [rows] = await db.query("SELECT id, branch, shortcode FROM branches");
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}