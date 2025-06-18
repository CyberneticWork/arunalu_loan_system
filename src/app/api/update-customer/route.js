import { connectDB } from "@/lib/db";

// API for updating the update_customer table only
export async function POST(req) {
  let connection;
  try {
    console.log("--- API CALL: update-customer ---");
    const data = await req.json();
    console.log("Received payload:", data);
    // Destructure and validate all required fields
    const {
      prefix,
      fullname,
      nic,
      gender,
      dob,
      location,
      address,
      telno,
      gs,
      ds,
      district,
      province,
      status,
      createby,
      editby,
    } = data;
    console.log("Main fields:", {
      prefix,
      fullname,
      nic,
      gender,
      dob,
      location,
      address,
      telno,
      gs,
      ds,
      district,
      province,
      status,
      createby,
      editby,
    });

    // Validate required fields
    if (
      !prefix ||
      !fullname ||
      !nic ||
      gender === undefined ||
      !dob ||
      !location ||
      !address ||
      !telno ||
      !gs ||
      !ds ||
      !district ||
      !province ||
      !status
    ) {
      console.log("Validation failed: missing required fields");
      return Response.json(
        { error: "Missing required fields", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }
    // Validate NIC format
    if (!(/^\d{12}$/.test(nic) || /^\d{9}[VvXx]$/.test(nic))) {
      console.log("Validation failed: invalid NIC format");
      return Response.json(
        { error: "Invalid NIC format", code: "INVALID_NIC" },
        { status: 400 }
      );
    }
    // Validate gender
    if (!(gender === 0 || gender === 1)) {
      console.log("Validation failed: invalid gender");
      return Response.json(
        { error: "Invalid gender value", code: "INVALID_GENDER" },
        { status: 400 }
      );
    }
    // Validate DOB
    if (isNaN(Date.parse(dob))) {
      console.log("Validation failed: invalid DOB");
      return Response.json(
        { error: "Invalid date of birth", code: "INVALID_DOB" },
        { status: 400 }
      );
    }
    function addOneDay(dateString) {
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split("T")[0];
    }

    connection = await connectDB();
    console.log("Connected to DB");
    // Check if a request exists for this NIC in update_customer
    const [existingRows] = await connection.execute(
      "SELECT status FROM update_customer WHERE nic = ?",
      [nic]
    );
    console.log("Existing customer rows:", existingRows);
    if (existingRows.length > 0) {
      // Always update both tables if exists
      console.log("Updating update_customer for NIC:", nic);
      await connection.execute(
        `UPDATE update_customer SET prefix=?, fullname=?, gender=?, dob=?, location=?, address=?, telno=?, gs=?, ds=?, district=?, province=?, status=?, editby=?, editat=NOW() WHERE nic=?`,
        [
          prefix,
          fullname,
          gender,
          addOneDay(dob),
          location,
          address,
          telno,
          gs,
          ds,
          district,
          province,
          status,
          editby || "system",
          nic,
        ]
      );
      if (data.spouse) {
        const { name, address, telno, relation } = data.spouse;
        console.log("Spouse payload:", data.spouse);
        // Check if spouse row exists for this NIC
        const [spouseRows] = await connection.execute(
          "SELECT id FROM update_spouse WHERE nic = ?",
          [nic]
        );
        console.log("Existing spouse rows:", spouseRows);
        if (spouseRows.length > 0) {
          console.log("Updating update_spouse for NIC:", nic);
          await connection.execute(
            `UPDATE update_spouse SET name=?, address=?, telno=?, relation=?, editby=?, editat=NOW() WHERE nic=?`,
            [name, address, telno, relation, editby || "system", nic]
          );
        } else {
          console.log("Inserting into update_spouse for NIC:", nic);
          await connection.execute(
            `INSERT INTO update_spouse (nic, name, address, telno, relation, customers, createby, editby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              nic,
              name,
              address,
              telno,
              relation,
              "N/A",
              createby || "system",
              editby || "system",
            ]
          );
        }
      }
      await connection.end();
      console.log("DB connection closed (update path)");
      return Response.json(
        { message: "Request updated", code: "SUCCESS" },
        { status: 200 }
      );
    } else {
      // Insert new request (customer + spouse)
      console.log("Inserting new customer for NIC:", nic);
      await connection.execute(
        `INSERT INTO update_customer (prefix, fullname, nic, gender, dob, location, address, telno, gs, ds, district, province, status, createby, editby)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prefix,
          fullname,
          nic,
          gender,
          dob,
          location,
          address,
          telno,
          gs,
          ds,
          district,
          province,
          status,
          createby || "system",
          editby || "system",
        ]
      );
      if (data.spouse) {
        const { name, address, telno, relation } = data.spouse;
        console.log("Spouse payload:", data.spouse);
        console.log("Inserting into update_spouse for NIC:", nic);
        await connection.execute(
          `INSERT INTO update_spouse (nic, name, address, telno, relation, customers, createby, editby) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nic,
            name,
            address,
            telno,
            relation,
            "N/A",
            createby || "system",
            editby || "system",
          ]
        );
      }
      await connection.end();
      console.log("DB connection closed (insert path)");
      return Response.json(
        { message: "Request created", code: "SUCCESS" },
        { status: 201 }
      );
    }
  } catch (error) {
    if (connection)
      try {
        await connection.end();
      } catch (e) {}
    console.error("Update Customer API Error:", error);
    let status = 500;
    let errorMsg = error.message || "Internal server error";
    let code = error.code || "SERVER_ERROR";
    if (errorMsg.includes("ER_DUP_ENTRY")) {
      status = 409;
      code = "DUPLICATE_ENTRY";
      errorMsg = "A customer with this NIC already exists in update_customer.";
    } else if (
      code === "INVALID_INPUT" ||
      code === "INVALID_NIC" ||
      code === "INVALID_GENDER" ||
      code === "INVALID_DOB"
    ) {
      status = 400;
    }
    return Response.json({ error: errorMsg, code }, { status });
  }
}