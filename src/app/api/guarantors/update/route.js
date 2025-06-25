import { connectDB } from "@/lib/db";

export async function POST(request) {
  let connection;
  try {
    const guarantorData = await request.json();

    // Extract guarantor ID
    const { id } = guarantorData;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Guarantor ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    connection = await connectDB();

    // Prepare the update query and values
    const updateFields = [];
    const updateValues = [];

    // Add each field that's present in the request
    if (guarantorData.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(guarantorData.name);
    }

    if (guarantorData.nic !== undefined) {
      updateFields.push("nic = ?");
      updateValues.push(guarantorData.nic);
    }

    if (guarantorData.address !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(guarantorData.address);
    }

    if (guarantorData.number !== undefined) {
      updateFields.push("number = ?");
      updateValues.push(guarantorData.number);
    }

    if (guarantorData.type !== undefined) {
      updateFields.push("type = ?");
      updateValues.push(guarantorData.type);
    }

    if (guarantorData.income !== undefined) {
      updateFields.push("income = ?");
      updateValues.push(guarantorData.income);
    }

    if (guarantorData.gender !== undefined) {
      updateFields.push("gender = ?");
      updateValues.push(guarantorData.gender);
    }

    if (guarantorData.dob !== undefined) {
      updateFields.push("dob = ?");
      updateValues.push(guarantorData.dob);
    }

    if (guarantorData.relation !== undefined) {
      updateFields.push("relation = ?");
      updateValues.push(guarantorData.relation);
    }

    if (guarantorData.province !== undefined) {
      updateFields.push("province = ?");
      updateValues.push(guarantorData.province);
    }

    if (guarantorData.gs !== undefined) {
      updateFields.push("gs = ?");
      updateValues.push(guarantorData.gs);
    }

    if (guarantorData.ds !== undefined) {
      updateFields.push("ds = ?");
      updateValues.push(guarantorData.ds);
    }

    if (guarantorData.district !== undefined) {
      updateFields.push("district = ?");
      updateValues.push(guarantorData.district);
    }

    if (guarantorData.accountno !== undefined) {
      updateFields.push("accountno = ?");
      updateValues.push(guarantorData.accountno);
    }

    if (guarantorData.bankname !== undefined) {
      updateFields.push("bankname = ?");
      updateValues.push(guarantorData.bankname);
    }

    // Add ID to the values list (for the WHERE clause)
    updateValues.push(id);

    // If there are no fields to update, return success without doing anything
    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No changes to update" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build and execute the update query
    const updateQuery = `UPDATE guarantor SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    const [result] = await connection.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Guarantor not found or no changes made",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Guarantor updated successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating guarantor:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error("Error closing DB connection:", e);
      }
    }
  }
}
