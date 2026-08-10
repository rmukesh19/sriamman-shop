import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Users,
  ShieldAlert,
  Check,
  Printer
} from "lucide-react";
const EmployeeModule = ({ loadAllData, triggerToast, activeSubTab }) => {
  const { t, language } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  useEffect(() => {
    if (activeSubTab && activeSubTab.startsWith("employee_")) {
      const sub = activeSubTab.replace("employee_", "");
      if (["dashboard", "list", "attendance", "leaves", "payroll", "advances", "incentives", "documents", "idcard", "resignation", "reports", "add"].includes(sub)) {
        if (sub === "add") {
          setActiveTab("list");
          openAddEditModal(null);
        } else {
          setActiveTab(sub);
        }
      }
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Staff");
  const [formPhone, setFormPhone] = useState("");
  const [formSalary, setFormSalary] = useState(15e3);
  const [formStatus, setFormStatus] = useState("Active");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState(["dashboard", "billing"]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [tempAttendance, setTempAttendance] = useState({});
  const [leaveDate, setLeaveDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveType, setLeaveType] = useState("Paid");
  const [salaryNetPaid, setSalaryNetPaid] = useState(15e3);
  const [salaryPaymentType, setSalaryPaymentType] = useState("Cash");
  const [salaryNote, setSalaryNote] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(1e3);
  const [advanceNote, setAdvanceNote] = useState("");
  const [incentiveAmount, setIncentiveAmount] = useState(500);
  const [incentiveReason, setIncentiveReason] = useState("");
  const [expPrevCompany, setExpPrevCompany] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expRole, setExpRole] = useState("");
  const [resDate, setResDate] = useState("");
  const [resReason, setResReason] = useState("");
  const [resLastDay, setResLastDay] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState(null);
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
        if (data.length > 0 && !selectedEmpId) {
          setSelectedEmpId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to fetch employee list");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEmployees();
  }, []);
  const openAddEditModal = (emp) => {
    if (emp) {
      setEditingEmp(emp);
      setFormName(emp.name);
      setFormRole(emp.role);
      setFormPhone(emp.phone);
      setFormSalary(emp.salary);
      setFormStatus(emp.status);
      setFormUsername(emp.username || "");
      setFormPassword(emp.password || "");
      setFormPermissions(emp.permissions || ["dashboard", "billing"]);
    } else {
      setEditingEmp(null);
      setFormName("");
      setFormRole("Staff");
      setFormPhone("");
      setFormSalary(15e3);
      setFormStatus("Active");
      setFormUsername("");
      setFormPassword("");
      setFormPermissions(["dashboard", "billing"]);
    }
    setShowModal(true);
  };
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      triggerToast("Name and phone are required");
      return;
    }
    const payload = {
      name: formName,
      role: formRole,
      phone: formPhone,
      salary: Number(formSalary),
      status: formStatus,
      username: formUsername || void 0,
      password: formPassword || void 0,
      permissions: formPermissions,
      experience: editingEmp?.experience || { previousCompany: "", duration: "", role: "" },
      resignation: editingEmp?.resignation || { isResigned: false }
    };
    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : "/api/employees";
      const method = editingEmp ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        triggerToast(editingEmp ? "Employee updated successfully!" : "Employee added successfully!");
        setShowModal(false);
        fetchEmployees();
        if (loadAllData) loadAllData();
      } else {
        triggerToast("Failed to save employee");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network error saving employee");
    }
  };
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Employee deleted successfully");
        fetchEmployees();
        if (loadAllData) loadAllData();
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to delete employee");
    }
  };
  const togglePermission = (perm) => {
    if (formPermissions.includes(perm)) {
      setFormPermissions(formPermissions.filter((p) => p !== perm));
    } else {
      setFormPermissions([...formPermissions, perm]);
    }
  };
  const activeEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  useEffect(() => {
    const temp = {};
    employees.forEach((emp) => {
      const record = emp.attendance?.find((a) => a.date === attendanceDate);
      temp[emp.id] = record?.status || "Present";
    });
    setTempAttendance(temp);
  }, [attendanceDate, employees]);
  const saveAttendance = async () => {
    try {
      let successCount = 0;
      for (const emp of employees) {
        const currentStatus = tempAttendance[emp.id] || "Present";
        const rawAttendance = emp.attendance || [];
        const filtered = rawAttendance.filter((a) => a.date !== attendanceDate);
        filtered.push({ date: attendanceDate, status: currentStatus });
        const res = await fetch(`/api/employees/${emp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendance: filtered })
        });
        if (res.ok) successCount++;
      }
      triggerToast(`Attendance saved for ${successCount} employees!`);
      fetchEmployees();
    } catch (e) {
      console.error(e);
      triggerToast("Error saving attendance");
    }
  };
  const submitLeave = async (e) => {
    e.preventDefault();
    if (!activeEmp) return;
    if (!leaveReason) {
      triggerToast("Leave reason is required");
      return;
    }
    const newLeave = {
      id: `leave-${Date.now()}`,
      date: leaveDate,
      reason: leaveReason,
      type: leaveType,
      status: "Pending"
    };
    const currentLeaves = activeEmp.leaves || [];
    const updatedLeaves = [...currentLeaves, newLeave];
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaves: updatedLeaves })
      });
      if (res.ok) {
        triggerToast("Leave requested submitted successfully!");
        setLeaveReason("");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const updateLeaveStatus = async (empId, leaveId, status) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const updatedLeaves = (emp.leaves || []).map((l) => l.id === leaveId ? { ...l, status } : l);
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaves: updatedLeaves })
      });
      if (res.ok) {
        triggerToast(`Leave request ${status.toLowerCase()}!`);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitSalary = async (e) => {
    e.preventDefault();
    if (!activeEmp) return;
    const newSalary = {
      id: `sal-${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      baseSalary: activeEmp.salary,
      netPaid: Number(salaryNetPaid),
      paymentType: salaryPaymentType,
      note: salaryNote
    };
    const currentSalaries = activeEmp.salaries || [];
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salaries: [...currentSalaries, newSalary] })
      });
      if (res.ok) {
        triggerToast("Salary processed successfully!");
        setSalaryNote("");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitAdvance = async (e) => {
    e.preventDefault();
    if (!activeEmp) return;
    const newAdvance = {
      id: `adv-${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      amount: Number(advanceAmount),
      note: advanceNote,
      recoveredAmount: 0
    };
    const currentAdvances = activeEmp.advances || [];
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advances: [...currentAdvances, newAdvance] })
      });
      if (res.ok) {
        triggerToast("Advance salary registered!");
        setAdvanceNote("");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitIncentive = async (e) => {
    e.preventDefault();
    if (!activeEmp) return;
    const newIncentive = {
      id: `inc-${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      amount: Number(incentiveAmount),
      reason: incentiveReason
    };
    const currentIncentives = activeEmp.incentives || [];
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incentives: [...currentIncentives, newIncentive] })
      });
      if (res.ok) {
        triggerToast("Incentive logged successfully!");
        setIncentiveReason("");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitResignation = async (e) => {
    e.preventDefault();
    if (!activeEmp) return;
    const resignationData = {
      isResigned: true,
      resignationDate: resDate,
      reason: resReason,
      lastWorkingDay: resLastDay
    };
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resignation: resignationData, status: "Inactive" })
      });
      if (res.ok) {
        triggerToast("Employee resignation processed.");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitDocument = async (e) => {
    e.preventDefault();
    if (!activeEmp || !docTitle) {
      triggerToast("Document title is required");
      return;
    }
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      url: `/uploads/doc_placeholder.pdf`
    };
    const currentDocs = activeEmp.documents || [];
    try {
      const res = await fetch(`/api/employees/${activeEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: [...currentDocs, newDoc] })
      });
      if (res.ok) {
        triggerToast("Document record uploaded successfully!");
        setDocTitle("");
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handlePrintIdCard = () => {
    const printContent = document.getElementById("employee-id-card-print");
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
  const pendingLeaves = employees.reduce((sum, e) => sum + (e.leaves?.filter((l) => l.status === "Pending").length || 0), 0);
  const totalAdvancesGranted = employees.reduce((sum, e) => sum + (e.advances?.reduce((s, a) => s + (a.amount - a.recoveredAmount), 0) || 0), 0);
  const filteredEmployees = employees.filter(
    (emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.role.toLowerCase().includes(searchQuery.toLowerCase()) || emp.phone.includes(searchQuery)
  );
  return <div className="space-y-6">
      {
    /* Module Title Bar */
  }
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Employee Management System
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage attendance, payroll, leaves, credentials, and credentials-based permissions</p>
        </div>
        <button
    onClick={() => openAddEditModal(null)}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-95 transition-all"
  >
          <Plus className="w-4 h-4" />
          Add New Employee
        </button>
      </div>

      {
    /* Internal submenu tabs have been removed. Guided strictly by Left Sidebar. */
  }

      {loading ? <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block" />
          <p className="text-xs font-bold text-slate-500 mt-3 animate-pulse">Loading Employees & Payroll Data...</p>
        </div> : <>
          {
    /* ==================== DASHBOARD TAB ==================== */
  }
          {activeTab === "dashboard" && <div className="space-y-6">
              {
    /* Quick KPI Overview */
  }
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md shadow-indigo-500/10 relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Total Active Workforce</span>
                  <span className="text-2xl font-black block mt-1">{activeCount} Employees</span>
                  <p className="text-[10px] text-white/80 mt-2 font-semibold">Across Store, Warehouse & Cash counters</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md shadow-emerald-500/10 relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Monthly Gross Payroll</span>
                  <span className="text-2xl font-black block mt-1">₹{totalPayroll.toLocaleString("en-IN")}</span>
                  <p className="text-[10px] text-white/80 mt-2 font-semibold">Standard Basic + Fixed allowances</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 rounded-2xl shadow-md shadow-amber-500/10 relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Pending Leaves Requests</span>
                  <span className="text-2xl font-black block mt-1">{pendingLeaves} Actions</span>
                  <p className="text-[10px] text-white/80 mt-2 font-semibold">Require immediate admin approval</p>
                </div>
                <div className="bg-gradient-to-br from-rose-600 to-red-700 text-white p-5 rounded-2xl shadow-md shadow-rose-500/10 relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Outstanding Advances</span>
                  <span className="text-2xl font-black block mt-1">₹{totalAdvancesGranted.toLocaleString("en-IN")}</span>
                  <p className="text-[10px] text-white/80 mt-2 font-semibold">To be recovered in next payroll cycle</p>
                </div>
              </div>

              {
    /* Attendance and Leave Highlights */
  }
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Workforce Summary</h3>
                  <div className="space-y-4">
                    {employees.map((emp) => {
    const presentDays = emp.attendance?.filter((a) => a.status === "Present").length || 0;
    const totalMarked = emp.attendance?.length || 1;
    const rate = Math.round(presentDays / totalMarked * 100);
    return <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">{emp.role} | {emp.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-blue-600 block">{rate}% Attendance</span>
                            <span className="text-[10px] text-slate-400 font-bold">{presentDays} of {totalMarked} days present</span>
                          </div>
                        </div>;
  })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Pending Leave Requests</h3>
                  <div className="space-y-4">
                    {employees.flatMap(
    (emp) => (emp.leaves || []).filter((l) => l.status === "Pending").map((l) => ({ emp, ...l }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.leaves || []).filter((l) => l.status === "Pending").map((l) => ({ emp, ...l }))
  ).map((leave) => <div key={leave.id} className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{leave.emp.name} ({leave.emp.role})</p>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-1">Date: {leave.date} | Type: <b className="text-amber-700">{leave.type} Leave</b></span>
                              <p className="text-xs text-slate-600 mt-1.5 bg-white border border-slate-100 p-2 rounded-lg font-medium">"{leave.reason}"</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
      onClick={() => updateLeaveStatus(leave.emp.id, leave.id, "Approved")}
      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
    >
                                Approve
                              </button>
                              <button
      onClick={() => updateLeaveStatus(leave.emp.id, leave.id, "Rejected")}
      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
    >
                                Reject
                              </button>
                            </div>
                          </div>)
  : <div className="text-center py-12 text-slate-400">
                        <Check className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                        <p className="text-xs font-bold text-slate-500">No pending leave requests found!</p>
                      </div>}
                  </div>
                </div>
              </div>
            </div>}

          {
    /* ==================== LIST TAB ==================== */
  }
          {activeTab === "list" && <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
    type="text"
    placeholder="Search employees..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
  />
                </div>
                <span className="text-xs font-bold text-slate-500">{filteredEmployees.length} registered employees</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
                      <th className="p-4">Employee Details</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Role / Duties</th>
                      <th className="p-4">Base Salary</th>
                      <th className="p-4">Login Access</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredEmployees.map((emp) => <tr key={emp.id} className="hover:bg-slate-50/40">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">{emp.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {emp.id}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{emp.phone}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase">
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">₹{emp.salary.toLocaleString("en-IN")}</td>
                        <td className="p-4">
                          {emp.username ? <div>
                              <p className="text-xs font-bold text-slate-700 font-mono">{emp.username}</p>
                              <span className="text-[9px] text-emerald-600 font-bold block">Has API Access</span>
                            </div> : <span className="text-slate-400 italic">No credentials</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
    onClick={() => openAddEditModal(emp)}
    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-block"
    title="Edit details & access permissions"
  >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
    onClick={() => handleDeleteEmployee(emp.id)}
    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-block"
    title="Remove completely"
  >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}

          {
    /* ==================== ATTENDANCE TAB ==================== */
  }
          {activeTab === "attendance" && <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Mark Daily Employee Attendance</h3>
                  <p className="text-xs text-slate-500">Record attendance details to feed payroll generation automatically</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-slate-600">Select Date:</span>
                  <input
    type="date"
    value={attendanceDate}
    onChange={(e) => setAttendanceDate(e.target.value)}
    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
  />
                </div>
              </div>

              <div className="space-y-3">
                {employees.map((emp) => <div key={emp.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-slate-150 rounded-xl hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{emp.role}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 mt-2.5 sm:mt-0">
                      {["Present", "Absent", "Half-day", "Leave"].map((status) => <button
    key={status}
    onClick={() => setTempAttendance({ ...tempAttendance, [emp.id]: status })}
    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${tempAttendance[emp.id] === status ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
  >
                          {status}
                        </button>)}
                    </div>
                  </div>)}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
    onClick={saveAttendance}
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
  >
                  <Save className="w-4 h-4" />
                  Save Changes ({attendanceDate})
                </button>
              </div>
            </div>}

          {
    /* ==================== LEAVES TAB ==================== */
  }
          {activeTab === "leaves" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Apply Leave Request</h3>
                <form onSubmit={submitLeave} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Leave Date</label>
                    <input
    type="date"
    value={leaveDate}
    onChange={(e) => setLeaveDate(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Leave Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
    type="button"
    onClick={() => setLeaveType("Paid")}
    className={`p-2 rounded-xl text-xs font-bold border ${leaveType === "Paid" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 border-slate-200"}`}
  >
                        Paid Leave
                      </button>
                      <button
    type="button"
    onClick={() => setLeaveType("Unpaid")}
    className={`p-2 rounded-xl text-xs font-bold border ${leaveType === "Unpaid" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 border-slate-200"}`}
  >
                        Unpaid Leave
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Detailed Reason</label>
                    <textarea
    placeholder="Medical reason, family event, emergency, etc..."
    value={leaveReason}
    onChange={(e) => setLeaveReason(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 h-24 focus:outline-none focus:border-blue-500"
  />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    Submit Request
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leave Logs & Requests</h3>
                <div className="space-y-3">
                  {employees.flatMap(
    (emp) => (emp.leaves || []).map((l) => ({ emp, ...l }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.leaves || []).map((l) => ({ emp, ...l }))
  ).map((leave) => <div key={leave.id} className="p-3 border border-slate-150 rounded-xl flex justify-between items-center bg-slate-50/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{leave.emp.name}</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{leave.emp.role}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1">Leave Date: {leave.date} | Category: <b>{leave.type}</b></span>
                            <p className="text-xs text-slate-600 mt-1 italic">"{leave.reason}"</p>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${leave.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : leave.status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                              {leave.status}
                            </span>
                          </div>
                        </div>)
  : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No leave logs recorded yet.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== PAYROLL TAB ==================== */
  }
          {activeTab === "payroll" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Disburse Salary</h3>
                <form onSubmit={submitSalary} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => {
      setSelectedEmpId(e.target.value);
      const emp = employees.find((x) => x.id === e.target.value);
      if (emp) setSalaryNetPaid(emp.salary);
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} (Base: ₹{e.salary})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Net Paid Amount (INR)</label>
                    <input
    type="number"
    value={salaryNetPaid}
    onChange={(e) => setSalaryNetPaid(Number(e.target.value))}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mode of Payment</label>
                    <select
    value={salaryPaymentType}
    onChange={(e) => setSalaryPaymentType(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      <option value="Cash">Cash Handover</option>
                      <option value="Bank Transfer">Direct Bank IMPS/NEFT</option>
                      <option value="UPI">UPI (GPay/PhonePe)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Payment Remarks</label>
                    <input
    type="text"
    placeholder="Salary for June 2026, minus 1 unpaid leave"
    value={salaryNote}
    onChange={(e) => setSalaryNote(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
  />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    Disburse & Log Salary
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Payroll Disbursement Logs</h3>
                <div className="space-y-3">
                  {employees.flatMap(
    (emp) => (emp.salaries || []).map((s) => ({ emp, ...s }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.salaries || []).map((s) => ({ emp, ...s }))
  ).map((sal) => <div key={sal.id} className="p-3 border border-slate-150 rounded-xl flex justify-between items-center bg-slate-50/50">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{sal.emp.name}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Paid on: {sal.date} | Mode: <b>{sal.paymentType}</b></span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">Remarks: {sal.note || "None"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-800 block">₹{sal.netPaid.toLocaleString("en-IN")}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">Base: ₹{sal.baseSalary}</span>
                          </div>
                        </div>)
  : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No salary records generated this month.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== ADVANCES TAB ==================== */
  }
          {activeTab === "advances" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Grant Advance Salary</h3>
                <form onSubmit={submitAdvance} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Advance Cash Amount (INR)</label>
                    <input
    type="number"
    value={advanceAmount}
    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Purpose / Notes</label>
                    <input
    type="text"
    placeholder="Advance for medical purpose, emergency, etc..."
    value={advanceNote}
    onChange={(e) => setAdvanceNote(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
  />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    Grant Advance
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Advance Cash ledger</h3>
                <div className="space-y-3">
                  {employees.flatMap(
    (emp) => (emp.advances || []).map((a) => ({ emp, ...a }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.advances || []).map((a) => ({ emp, ...a }))
  ).map((adv) => <div key={adv.id} className="p-3 border border-slate-150 rounded-xl flex justify-between items-center bg-slate-50/50">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{adv.emp.name}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Granted Date: {adv.date} | Note: <i>{adv.note}</i></span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-rose-600 block">₹{(adv.amount - adv.recoveredAmount).toLocaleString("en-IN")} Due</span>
                            <span className="text-[9px] text-slate-400 block">Total: ₹{adv.amount}</span>
                          </div>
                        </div>)
  : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No advance ledgers active.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== INCENTIVES TAB ==================== */
  }
          {activeTab === "incentives" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Log Incentive / Bonus</h3>
                <form onSubmit={submitIncentive} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Incentive Amount (INR)</label>
                    <input
    type="number"
    value={incentiveAmount}
    onChange={(e) => setIncentiveAmount(Number(e.target.value))}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reason / Achievements</label>
                    <input
    type="text"
    placeholder="Excellent sales target completion, festival bonus, etc..."
    value={incentiveReason}
    onChange={(e) => setIncentiveReason(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
  />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    Log Incentive
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Incentive Logs</h3>
                <div className="space-y-3">
                  {employees.flatMap(
    (emp) => (emp.incentives || []).map((i) => ({ emp, ...i }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.incentives || []).map((i) => ({ emp, ...i }))
  ).map((inc) => <div key={inc.id} className="p-3 border border-slate-150 rounded-xl flex justify-between items-center bg-slate-50/50">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{inc.emp.name}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Date: {inc.date} | Achievement: <i>{inc.reason}</i></span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-emerald-600 block">+ ₹{inc.amount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>)
  : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No incentive logs tracked yet.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== DOCUMENTS TAB ==================== */
  }
          {activeTab === "documents" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Upload ID/Certificates</h3>
                <form onSubmit={submitDocument} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Document Title</label>
                    <input
    type="text"
    placeholder="Aadhaar Card, driving license, etc..."
    value={docTitle}
    onChange={(e) => setDocTitle(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Choose File</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <p className="text-xs text-slate-500 font-bold">PDF, PNG, JPG (Max 5MB)</p>
                      <input type="file" className="hidden" id="emp-doc-input" onChange={(e) => e.target.files && setDocFile(e.target.files[0])} />
                      <button type="button" onClick={() => document.getElementById("emp-doc-input")?.click()} className="text-xs text-blue-600 underline font-semibold mt-1">Browse</button>
                      {docFile && <p className="text-[10px] text-emerald-600 font-bold mt-2">Selected: {docFile.name}</p>}
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    Save Document Record
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Digital Document Cabinets</h3>
                <div className="space-y-3">
                  {employees.flatMap(
    (emp) => (emp.documents || []).map((d) => ({ emp, ...d }))
  ).length > 0 ? employees.flatMap(
    (emp) => (emp.documents || []).map((d) => ({ emp, ...d }))
  ).map((doc) => <div key={doc.id} className="p-3 border border-slate-150 rounded-xl flex justify-between items-center bg-slate-50/50">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Employee: <b>{doc.emp.name}</b> ({doc.emp.role})</span>
                          </div>
                          <a href="#" onClick={(e) => {
      e.preventDefault();
      triggerToast("Downloading file...");
    }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            View/Download
                          </a>
                        </div>)
  : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No identity documents registered.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== ID CARD TAB ==================== */
  }
          {activeTab === "idcard" && <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Generate & Print Employee ID Card</h3>
                  <p className="text-xs text-slate-500">Pick any employee to format and print their official SAT ID Badge</p>
                </div>
                <div className="flex gap-3">
                  <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
  >
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <button
    onClick={handlePrintIdCard}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
  >
                    <Printer className="w-4 h-4" />
                    Print ID
                  </button>
                </div>
              </div>

              {activeEmp && <div className="flex justify-center p-8 bg-slate-100 rounded-2xl">
                  {
    /* Visual ID Card Preview */
  }
                  <div id="employee-id-card-print" className="w-80 bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-xl font-sans">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-8 text-center text-white relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                      <h4 className="text-xs font-black tracking-widest uppercase text-blue-200">SRI AMMAN TRADERS</h4>
                      <p className="text-[9px] text-white/80 font-semibold tracking-wider uppercase mt-1">Erode, Tamil Nadu</p>
                    </div>

                    <div className="px-6 py-8 text-center -mt-10 relative z-10">
                      <div className="w-24 h-24 bg-white border-4 border-slate-100 rounded-full mx-auto shadow-md overflow-hidden flex items-center justify-center font-black text-blue-600 text-3xl mb-4">
                        {activeEmp.name.charAt(0)}
                      </div>

                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">{activeEmp.name}</h3>
                      <p className="text-xs text-blue-600 font-extrabold uppercase mt-1 bg-blue-50 px-3 py-1 rounded-full w-max mx-auto">{activeEmp.role}</p>

                      <div className="mt-6 border-t border-slate-100 pt-6 text-left space-y-2 text-[10px] text-slate-600 font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-400">EMPLOYEE ID:</span>
                          <span className="font-mono text-slate-800">{activeEmp.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">PHONE:</span>
                          <span className="text-slate-800">{activeEmp.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ISSUE DATE:</span>
                          <span className="text-slate-800">July 2026</span>
                        </div>
                      </div>

                      <div className="mt-8 border-t border-slate-100 pt-6">
                        {
    /* Mock Barcode */
  }
                        <div className="h-8 bg-slate-900 mx-auto flex items-center justify-center gap-0.5 px-4 rounded font-mono text-[9px] text-white">
                          ||| | |||| | ||| | {activeEmp.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>}

          {
    /* ==================== RESIGNATION TAB ==================== */
  }
          {activeTab === "resignation" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Process Employee Resignation</h3>
                <form onSubmit={submitResignation} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Employee</label>
                    <select
    value={selectedEmpId}
    onChange={(e) => setSelectedEmpId(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                      {employees.filter((emp) => !emp.resignation?.isResigned).map((e) => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Resignation Date</label>
                    <input
    type="date"
    value={resDate}
    onChange={(e) => setResDate(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Last Working Day</label>
                    <input
    type="date"
    value={resLastDay}
    onChange={(e) => setResLastDay(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reason for leaving</label>
                    <textarea
    value={resReason}
    onChange={(e) => setResReason(e.target.value)}
    placeholder="Better opportunity, relocation, retirement..."
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 h-24 focus:outline-none focus:border-blue-500"
  />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">
                    Mark as Resigned
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Past / Relieved Employees</h3>
                <div className="space-y-3">
                  {employees.filter((emp) => emp.resignation?.isResigned).length > 0 ? employees.filter((emp) => emp.resignation?.isResigned).map((emp) => <div key={emp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Relieved: {emp.resignation?.lastWorkingDay} | Role: <b>{emp.role}</b></span>
                          <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-100 font-medium italic">"{emp.resignation?.reason}"</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase">Relieved</span>
                      </div>) : <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-semibold">No relieved employee histories found.</p>
                    </div>}
                </div>
              </div>
            </div>}

          {
    /* ==================== REPORTS TAB ==================== */
  }
          {activeTab === "reports" && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Workforce Payroll Overview</h3>
                <div className="space-y-3">
                  {employees.map((emp) => <div key={emp.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                        <span className="text-[10px] text-slate-400 font-bold">{emp.role}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-700">₹{emp.salary.toLocaleString("en-IN")}/mo</span>
                      </div>
                    </div>)}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Attendance statistics</h3>
                <div className="space-y-3">
                  {employees.map((emp) => {
    const total = emp.attendance?.length || 0;
    const present = emp.attendance?.filter((x) => x.status === "Present").length || 0;
    return <div key={emp.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{emp.name}</span>
                          <span>{present} / {total} Days</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
      style={{ width: `${total > 0 ? present / total * 100 : 100}%` }}
      className="bg-blue-600 h-full"
    />
                        </div>
                      </div>;
  })}
                </div>
              </div>
            </div>}
        </>}

      {
    /* ==================== ADD / EDIT MODAL ==================== */
  }
      {showModal && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                {editingEmp ? "Edit Employee Profile" : "Register New Employee"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name *</label>
                  <input
    type="text"
    required
    value={formName}
    onChange={(e) => setFormName(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
    placeholder="Enter full name"
  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number *</label>
                  <input
    type="text"
    required
    value={formPhone}
    onChange={(e) => setFormPhone(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
    placeholder="10-digit mobile number"
  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Job Designation</label>
                  <select
    value={formRole}
    onChange={(e) => setFormRole(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Billing Clerk">Billing Clerk</option>
                    <option value="Delivery Handler">Delivery Handler</option>
                    <option value="Store Assistant">Store Assistant</option>
                    <option value="Staff">General Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Base Salary (INR) *</label>
                  <input
    type="number"
    required
    value={formSalary}
    onChange={(e) => setFormSalary(Number(e.target.value))}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Workforce Status</label>
                  <select
    value={formStatus}
    onChange={(e) => setFormStatus(e.target.value)}
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Suspended / Inactive</option>
                  </select>
                </div>
              </div>

              {
    /* Login Credentials and Role Permissions Section */
  }
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Login Access & Permissions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Portal Username</label>
                    <input
    type="text"
    value={formUsername}
    onChange={(e) => setFormUsername(e.target.value)}
    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 font-mono"
    placeholder="Username for login"
  />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Portal Password</label>
                    <input
    type="text"
    value={formPassword}
    onChange={(e) => setFormPassword(e.target.value)}
    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 font-mono"
    placeholder="Password for login"
  />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Check Allowed Screen Permissions</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
    { id: "dashboard", label: "Dashboard" },
    { id: "billing", label: "Billing POS" },
    { id: "master", label: "Masters" },
    { id: "purchase", label: "Purchase Entry" },
    { id: "inventory", label: "Inventory" },
    { id: "reports", label: "Reports" },
    { id: "accounts", label: "Accounts Ledger" },
    { id: "employee", label: "Employee Hub" },
    { id: "settings", label: "System Settings" }
  ].map((perm) => <button
    key={perm.id}
    type="button"
    onClick={() => togglePermission(perm.id)}
    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${formPermissions.includes(perm.id) ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
  >
                        <span>{perm.label}</span>
                        {formPermissions.includes(perm.id) && <Check className="w-3.5 h-3.5" />}
                      </button>)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
    type="button"
    onClick={() => setShowModal(false)}
    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
  >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export {
  EmployeeModule
};
