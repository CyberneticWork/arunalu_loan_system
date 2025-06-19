import { connectDB } from "@/lib/db";
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(req) {
 
  
  let connection;
  try {
    const body = await req.json();
    console.log(body);
    const {
      username,
      empid,
      name,
      email,
      roll,
      password,
      tellno,
      branchID,
      addby
    } = body;

    // Convert branchID to integer
    const branchIDInt = parseInt(branchID);
    console.log(password);
    console.log(isNaN(branchIDInt));
    // if (isNaN(branchIDInt)) {
    //   return Response.json({
    //     code: "ERROR",
    //     message: "Invalid branch ID"
    //   }, { status: 400 });
    // }

    // Validate required fields
    if (!username || !empid || !name || !email || !roll || !password || !branchID || !addby) {
      return Response.json({
        code: "ERROR",
        message: "All fields are required"
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({
        code: "ERROR",
        message: "Invalid email format"
      }, { status: 400 });
    }

    // Validate phone number format
    if (!tellno.match(/^[0-9]{10}$/)) {
      return Response.json({
        code: "ERROR",
        message: "Invalid phone number. Must be 10 digits"
      }, { status: 400 });
    }

    // Validate branchID
    console.log(typeof branchIDInt);
    console.log(branchIDInt);

    if (typeof branchIDInt !== 'number') {
      return Response.json({
        code: "ERROR",
        message: "Invalid branch ID"
      }, { status: 400 });
    }

    // Validate addby
    if (typeof addby !== 'number') {
      return Response.json({
        code: "ERROR",
        message: "Invalid addby ID"
      }, { status: 400 });
    }

    connection = await connectDB();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate hash for the employee
    const id = randomUUID();

const hash = bcrypt.hashSync(id, 10);

    let acl = "";
    if (roll === "admin") {
      acl = "MSwyLDMsNCw1LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE4";
    } 

    // Insert the new employee
    await connection.execute(
      "INSERT INTO employees (username, empid, name, email, acl, roll, pass, tellno, branchID, hash, addby, access) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        username,
        empid,
        name,
        email,
        acl,
        roll,
        hashedPassword,
        tellno,
        branchIDInt,
        hash,
        addby,
        1,
      ]
    );
 

    return Response.json({
      code: "SUCCESS",
      message: "Employee added successfully"
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    return Response.json({
      code: "ERROR",
      message: error.message || "Failed to add employee"
    }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
  }
}
