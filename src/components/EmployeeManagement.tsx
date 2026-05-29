"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";

const SECTIONS = [
  "ADMIN", "SALES SUPERVISOR", "PRODUCTION HEAD", "HYGIENE DEPT", "PRODUCTION",
  "PROD - LUXURY ICE", "CLEANER", "VEHICLE MAINTENANCE", "ACCOMMODATION", "HOUSE DRIVER",
  "JELAT", "DRIVER - DUBAI", "DRIVER - ABU DHABI", "DRIVER - OTHER EMIRATES", "DRIVER - FUJAIRAH",
  "DRIVERS", "SALESMAN - DUBAI", "SALESMAN - ABU DHABI", "SALESMAN - OTHER EMIRATES", "SALESMAN - FUJAIRAH",
  "SALESMAN", "PROD NIGHT SHIFT", "AL QUOZ TECHNICIAN", "PRODUCTION UMQ", "UMQ - TECHNICIAN",
  "PRODUCTION UMQ NIGHT SHIFT", "FUJAIRAH FACTORY", "PROD NIGHT - LUXURY ICE",
];

const ALL_GROUPS = ["ADMIN", "OFFICE/ADMIN", "CLEANER", "DRIVERS", "MECHANIC", "SALESMAN", "UMQ FACTORY", "FUJAIRAH FACTORY", "FACTORY/PRODUCTION", "DUBAI FACTORY", "DUBAI FACTORY NIGHT"];

function sectionToGroup(section: string): string {
  if (["ADMIN", "SALES SUPERVISOR", "JELAT"].includes(section)) return "ADMIN";
  if (["PRODUCTION HEAD", "HYGIENE DEPT"].includes(section)) return "OFFICE/ADMIN";
  if (["CLEANER", "ACCOMMODATION"].includes(section)) return "CLEANER";
  if (section.startsWith("DRIVER") || section === "DRIVERS" || section === "HOUSE DRIVER") return "DRIVERS";
  if (["VEHICLE MAINTENANCE"].includes(section)) return "MECHANIC";
  if (section.startsWith("SALESMAN")) return "SALESMAN";
  if (["PRODUCTION UMQ", "UMQ - TECHNICIAN", "UMQ TECHNICIAN"].includes(section)) return "UMQ FACTORY";
  if (["PRODUCTION UMQ NIGHT SHIFT", "FUJAIRAH FACTORY"].includes(section)) return "FACTORY/PRODUCTION";
  if (["PRODUCTION", "PROD - LUXURY ICE", "AL QUOZ TECHNICIAN"].includes(section)) return "DUBAI FACTORY";
  if (["PROD NIGHT SHIFT", "PROD NIGHT - LUXURY ICE"].includes(section)) return "DUBAI FACTORY NIGHT";
  return "ADMIN";
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", section: SECTIONS[0], grp: ALL_GROUPS[0], location: "" });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: "", section: "", grp: "", location: "" });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
    setLoading(false);
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      const data = await res.json();
      if (data.employee) {
        setEmployees([...employees, data.employee]);
        setNewEmployee({ name: "", section: SECTIONS[0], grp: ALL_GROUPS[0], location: "" });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Failed to add employee:", error);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const deleteEmployee = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      setEmployees(employees.filter((e) => e.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Failed to delete employee:", error);
      setConfirmDeleteId(null);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditData({ name: emp.name, section: emp.section, grp: emp.grp, location: emp.location || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: "", section: "", grp: "", location: "" });
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      const data = await res.json();
      if (data.employee) {
        setEmployees(employees.map((e) => (e.id === id ? { ...e, ...data.employee } : e)));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
    }
  };

  const handleNewSectionChange = (section: string) => {
    const grp = sectionToGroup(section);
    setNewEmployee({ ...newEmployee, section, grp });
  };

  const handleEditSectionChange = (section: string) => {
    const grp = sectionToGroup(section);
    setEditData({ ...editData, section, grp });
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.section.toLowerCase().includes(search.toLowerCase()) ||
      e.grp.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading employees...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Employee Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {showAddForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addEmployee} className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Employee Name"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value.toUpperCase() })}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <select
            value={newEmployee.section}
            onChange={(e) => handleNewSectionChange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={newEmployee.grp}
            onChange={(e) => setNewEmployee({ ...newEmployee, grp: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {ALL_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location"
            value={newEmployee.location}
            onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value.toUpperCase() })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
            Add
          </button>
        </form>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, section, or group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded-lg px-4 py-2 text-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Section</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Group</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, idx) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                {editingId === emp.id ? (
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value.toUpperCase() })}
                      className="border rounded px-2 py-1 text-xs w-full font-medium"
                    />
                  </td>
                ) : (
                  <td className="px-4 py-2 font-medium">{emp.name}</td>
                )}
                {editingId === emp.id ? (
                  <>
                    <td className="px-4 py-2">
                      <select
                        value={editData.section}
                        onChange={(e) => handleEditSectionChange(e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      >
                        {SECTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editData.grp}
                        onChange={(e) => setEditData({ ...editData, grp: e.target.value })}
                        className="border rounded px-2 py-1 text-xs w-full"
                      >
                        {ALL_GROUPS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value.toUpperCase() })}
                        className="border rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveEdit(emp.id)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-gray-600">{emp.section}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{emp.grp}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{emp.location || "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(emp)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          onBlur={() => setTimeout(() => setConfirmDeleteId(null), 200)}
                          className={`text-xs font-medium ${confirmDeleteId === emp.id ? "bg-red-600 text-white px-2 py-0.5 rounded animate-pulse" : "text-red-500 hover:text-red-700"}`}
                        >
                          {confirmDeleteId === emp.id ? "⚠️ Confirm?" : "Remove"}
                        </button>
                        {confirmDeleteId === emp.id && (
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500">
          Showing {filtered.length} of {employees.length} employees
        </div>
      </div>
    </div>
  );
}
