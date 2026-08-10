import { dbInstance } from "../config/dbInstance.js";
import { generateToken } from "../utils/generateToken.js";

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = dbInstance.get();

    let userObj = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === password);
    let isEmployee = false;
    let employeePermissions = undefined;

    if (!userObj && db.employees) {
      const emp = db.employees.find((e) => e.username && e.username.toLowerCase() === username.toLowerCase() && e.password === password);
      if (emp) {
        if (emp.status !== "Active") {
          return res.status(403).json({ success: false, message: "Employee account is inactive" });
        }
        isEmployee = true;
        userObj = {
          id: emp.id,
          username: emp.username,
          role: emp.role,
          fullName: emp.name
        };
        employeePermissions = emp.permissions || ["dashboard", "billing", "master", "purchase", "inventory", "reports", "accounts", "employee", "settings"];
      }
    }

    if (!userObj) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    if (!isEmployee && userObj.status !== "Active") {
      return res.status(403).json({ success: false, message: "User account is suspended" });
    }

    const token = generateToken({
      id: userObj.id,
      username: userObj.username,
      role: userObj.role
    });

    return res.json({
      success: true,
      token,
      user: {
        id: userObj.id,
        username: userObj.username,
        role: userObj.role,
        fullName: userObj.fullName,
        permissions: employeePermissions
      },
      settings: db.companySettings
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
