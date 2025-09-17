import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";

// GET /api/blacklist-customers - Get all blacklisted customers
export async function GET() {
  let connection;
  try {
    connection = await connectDB();

    // Query to get all blacklisted customers
    const [rows] = await connection.execute(`
      SELECT
        id,
        fullname,
        prefix,
        nic,
        gender,
        dob,
        location,
        telno,
        address,
        gs,
        ds,
        district,
        province,
        status,
        isBlacklisted,
        createby,
        createat,
        editby,
        editat
      FROM customer
      WHERE isBlacklisted = true
      ORDER BY createat DESC
    `);

    return NextResponse.json({
      success: true,
      message: "Blacklisted customers retrieved successfully",
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Error fetching blacklisted customers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve blacklisted customers" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST /api/blacklist-customers - Add or remove customer from blacklist
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    // Accept either numeric id or NIC
    const { customerId, nic, action } = body; // action: 'blacklist' or 'unblacklist'

    if ((!customerId && !nic) || !action) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer identifier (ID or NIC) and action are required",
        },
        { status: 400 }
      );
    }

    if (!["blacklist", "unblacklist"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action. Must be 'blacklist' or 'unblacklist'",
        },
        { status: 400 }
      );
    }

    connection = await connectDB();

    // Check if customer exists (by id or nic)
    let customerRows;
    if (customerId) {
      [customerRows] = await connection.execute(
        "SELECT id, fullname, nic, isBlacklisted FROM customer WHERE id = ?",
        [customerId]
      );
    } else if (nic) {
      [customerRows] = await connection.execute(
        "SELECT id, fullname, nic, isBlacklisted FROM customer WHERE nic = ?",
        [nic]
      );
    }

    if (customerRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = customerRows[0];
    const newBlacklistStatus = action === "blacklist" ? true : false;

    // Check if already in desired state
    if (customer.isBlacklisted === newBlacklistStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Customer is already ${
            action === "blacklist" ? "blacklisted" : "not blacklisted"
          }`,
        },
        { status: 400 }
      );
    }

    // Update customer's blacklist status
    await connection.execute(
      "UPDATE customer SET isBlacklisted = ?, editat = NOW() WHERE id = ?",
      [newBlacklistStatus, customer.id]
    );

    // Get updated customer data
    const [updatedRows] = await connection.execute(
      "SELECT * FROM customer WHERE id = ?",
      [customer.id]
    );

    return NextResponse.json({
      success: true,
      message: `Customer ${
        action === "blacklist" ? "blacklisted" : "removed from blacklist"
      } successfully`,
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Error updating customer blacklist status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update customer blacklist status" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
