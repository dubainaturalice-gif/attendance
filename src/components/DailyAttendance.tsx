"use client";

import { useState, useEffect, useCallback } from "react";
import { Employee } from "@/lib/types";

const GROUP_FILTERS = ["ALL", "OFFICE/ADMIN", "ADMIN", "CLEANER", "DRIVERS", "MECHANIC", "SALESMAN", "UMQ FACTORY", "FUJAIRAH FACTORY", "FACTORY/PRODUCTION", "DUBAI FACTORY", "DUBAI FACTORY NIGHT"];

const SECTION_COLORS: Record<string, string> = {
  "ADMIN": "#4472C4",
  "SALES SUPERVISOR": "#4472C4",
  "PRODUCTION HEAD": "#C55A11",
  "HYGIENE DEPT": "#548235",
  "PRODUCTION": "#548235",
  "PROD - LUXURY ICE": "#BF8F00",
  "CLEANER": "#4472C4",
  "VEHICLE MAINTENANCE": "#4472C4",
  "ACCOMMODATION": "#4472C4",
  "HOUSE DRIVER": "#4472C4",
  "JELAT": "#2F5496",
  "DRIVER - DUBAI": "#4472C4",
  "DRIVER - ABU DHABI": "#4472C4",
  "DRIVER - OTHER EMIRATES": "#4472C4",
  "DRIVER - FUJAIRAH": "#C55A11",
  "DRIVERS": "#4472C4",
  "SALESMAN - DUBAI": "#4472C4",
  "SALESMAN - ABU DHABI": "#548235",
  "SALESMAN - OTHER EMIRATES": "#4472C4",
  "SALESMAN - FUJAIRAH": "#C55A11",
  "SALESMAN": "#4472C4",
  "PROD NIGHT SHIFT": "#2F5496",
  "AL QUOZ TECHNICIAN": "#548235",
  "PRODUCTION UMQ": "#7030A0",
  "UMQ - TECHNICIAN": "#548235",
  "PRODUCTION UMQ NIGHT SHIFT": "#C55A11",
  "UMQ TECHNICIAN": "#548235",
  "FUJAIRAH FACTORY": "#C55A11",
  "PROD NIGHT - LUXURY ICE": "#BF8F00",
};

// Map groups to PDF column titles
const PDF_COLUMN_MAP: Record<string, string> = {
  "ADMIN": "ADMIN",
  "OFFICE/ADMIN": "ADMIN",
  "CLEANER": "ADMIN",
  "DRIVERS": "DRIVERS",
  "SALESMAN": "SALESMAN",
  "UMQ FACTORY": "UMQ FACTORY",
  "FACTORY/PRODUCTION": "UMQ FACTORY",
  "MECHANIC": "UMQ FACTORY",
  "DUBAI FACTORY": "DUBAI FACTORY",
  "DUBAI FACTORY NIGHT": "DUBAI FACTORY",
  "FUJAIRAH FACTORY": "FUJAIRAH FACTORY",
};

const PDF_COLUMN_ORDER = ["ADMIN", "DRIVERS", "SALESMAN", "UMQ FACTORY", "DUBAI FACTORY", "FUJAIRAH FACTORY"];

const COLUMN_HEADER_COLORS: Record<string, string> = {
  "ADMIN": "#2E5090",
  "DRIVERS": "#4472C4",
  "SALESMAN": "#548235",
  "UMQ FACTORY": "#7030A0",
  "DUBAI FACTORY": "#C55A11",
  "FUJAIRAH FACTORY": "#C55A11",
};

function toggleStatus(current: string, clicked: string): string {
  // All statuses are exclusive — click to select, click again to deselect
  return current === clicked ? "" : clicked;
}

function formatDateForDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

export default function DailyAttendance() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<number, string>>({});
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const DAYS_OF_WEEK = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleDayOffChange = async (empId: number, dayOff: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, off_day: dayOff } : e))
    );
    try {
      await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: empId, off_day: dayOff }),
      });
    } catch (error) {
      console.error("Failed to update day off:", error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setAttendance(data.attendance || {});
      setOriginalAttendance(data.attendance || {});
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusClick = (empId: number, status: string) => {
    const current = attendance[empId] || "";
    const newStatus = toggleStatus(current, status);
    setAttendance({ ...attendance, [empId]: newStatus });
  };

  const getFilteredEmployees = () => {
    let filtered = employees;
    if (groupFilter !== "ALL") {
      filtered = filtered.filter((e) => e.grp === groupFilter);
    }
    return filtered;
  };

  const markAllPresent = () => {
    const filtered = getFilteredEmployees();
    const updated = { ...attendance };
    filtered.forEach((emp) => {
      if (!updated[emp.id]) {
        updated[emp.id] = "P";
      }
    });
    setAttendance(updated);
  };

  const resetDay = async () => {
    try {
      const res = await fetch(`/api/attendance?date=${date}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAttendance({});
        setOriginalAttendance({});
        setSaveMessage("Day reset successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Reset failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Reset failed:", error);
      setSaveMessage("Reset failed. Please try again.");
    }
    setConfirmReset(false);
  };

  const saveAttendance = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const records: { employee_id: number; date: string; status: string }[] = [];
      for (const emp of employees) {
        const current = attendance[emp.id] || "";
        const original = originalAttendance[emp.id] || "";
        if (current !== original) {
          records.push({ employee_id: emp.id, date, status: current });
        }
      }
      if (records.length === 0) {
        setSaveMessage("No changes to save.");
        setSaving(false);
        return;
      }
      for (let i = 0; i < records.length; i += 20) {
        const batch = records.slice(i, i + 20);
        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: batch }),
        });
      }
      setOriginalAttendance({ ...attendance });
      setSaveMessage(`Saved ${records.length} records successfully!`);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveMessage("Save failed. Please try again.");
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const exportPDF = async () => {
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      await import("jspdf-autotable");

      const dateDisplay = formatDateForDisplay(date);

      // Build columns
      const columnEmployees: Record<string, Employee[]> = {};
      for (const colTitle of PDF_COLUMN_ORDER) columnEmployees[colTitle] = [];
      for (const emp of employees) {
        const colTitle = PDF_COLUMN_MAP[emp.grp] || "ADMIN";
        if (!columnEmployees[colTitle]) columnEmployees[colTitle] = [];
        columnEmployees[colTitle].push(emp);
      }

      // Find the tallest column to determine page height
      let maxRows = 0;
      for (const colTitle of PDF_COLUMN_ORDER) {
        const emps = columnEmployees[colTitle];
        // Count section headers
        const secs = new Set(emps.map(e => e.section));
        const rows = emps.length + secs.size + 2; // +2 for col header + sub header
        if (rows > maxRows) maxRows = rows;
      }

      const rowH = 4.2;
      const neededHeight = 25 + (maxRows * rowH) + 30; // title + rows + totals
      const pageHeight = Math.max(210, neededHeight);
      const numCols = PDF_COLUMN_ORDER.length;
      const pageWidth = numCols <= 5 ? 297 : 350; // wider for 6+ columns
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageWidth, pageHeight] });

      // Title
      doc.setFontSize(11);
      doc.setTextColor(46, 80, 144);
      doc.setFont("helvetica", "bold");
      doc.text(dateDisplay, pageWidth / 2, 10, { align: "center" });

      // Totals tracking
      let totalP = 0, totalOT = 0, totalO = 0, totalL = 0, totalV = 0;
      let maxFinalY = 0;

      const colWidth = (pageWidth - 20) / numCols; // dynamic columns with margins
      const startY = 15;

      for (let colIdx = 0; colIdx < PDF_COLUMN_ORDER.length; colIdx++) {
        const colTitle = PDF_COLUMN_ORDER[colIdx];
        const colEmps = columnEmployees[colTitle] || [];
        const colColor = hexToRgb(COLUMN_HEADER_COLORS[colTitle] || "#2E5090");
        const x = 5 + colIdx * colWidth;

        // Group by section
        const sectionMap: Record<string, Employee[]> = {};
        for (const emp of colEmps) {
          if (!sectionMap[emp.section]) sectionMap[emp.section] = [];
          sectionMap[emp.section].push(emp);
        }

        // Build table body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any[][] = [];

        let sl = 1;
        for (const section of Object.keys(sectionMap)) {
          const sectionEmps = sectionMap[section];
          const sColor = hexToRgb(SECTION_COLORS[section] || "#4472C4");

          // Section header
          body.push([{
            content: section, colSpan: 4, styles: { fillColor: sColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5 }
          }, "", "", ""]);

          for (const emp of sectionEmps) {
            const status = attendance[emp.id] || "";
            let statusTextColor: [number, number, number] = [0, 0, 0];
            let statusBgColor: [number, number, number] | undefined = undefined;
            if (status === "P") { statusTextColor = [255, 255, 255]; statusBgColor = [0, 176, 80]; }
            else if (status === "OT") { statusTextColor = [0, 0, 0]; statusBgColor = [255, 192, 0]; }
            else if (status === "O") { statusTextColor = [255, 255, 255]; statusBgColor = [255, 165, 0]; }
            else if (status === "L") { statusTextColor = [255, 255, 255]; statusBgColor = [220, 38, 38]; }
            else if (status === "V") { statusTextColor = [255, 255, 255]; statusBgColor = [37, 99, 235]; }

            body.push([
              { content: sl.toString(), styles: { halign: "center", fontSize: 4 } },
              { content: emp.name, styles: { fontSize: 4 } },
              { content: emp.location || "", styles: { fontSize: 4 } },
              { content: status, styles: { halign: "center", textColor: statusTextColor, fillColor: statusBgColor, fontStyle: "bold", fontSize: 4.5 } },
            ]);

            if (status === "P") totalP++;
            if (status === "OT") totalOT++;
            if (status === "O") totalO++;
            if (status === "L") totalL++;
            if (status === "V") totalV++;
            sl++;
          }
        }

        if (colEmps.length === 0) {
          body.push([{ content: "No employees", colSpan: 4, styles: { fontSize: 4, textColor: [150, 150, 150], halign: "center", fontStyle: "italic" } }, "", "", ""]);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({
          head: [
            [{ content: colTitle, colSpan: 4, styles: { fillColor: colColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 5.5, halign: "center" } }, "", "", ""],
            [
              { content: "SL", styles: { fillColor: [217, 226, 243], fontStyle: "bold", halign: "center", fontSize: 4.5 } },
              { content: "NAME", styles: { fillColor: [217, 226, 243], fontStyle: "bold", fontSize: 4.5 } },
              { content: "LOC", styles: { fillColor: [217, 226, 243], fontStyle: "bold", fontSize: 4.5 } },
              { content: "ST", styles: { fillColor: [217, 226, 243], fontStyle: "bold", halign: "center", fontSize: 4.5 } },
            ],
          ],
          body: body,
          startY: startY,
          margin: { left: x, right: pageWidth - x - colWidth + 2 },
          tableWidth: colWidth - 3,
          styles: {
            fontSize: 4,
            cellPadding: 0.8,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
          },
          columnStyles: {
            0: { cellWidth: 7 },
            1: { cellWidth: colWidth - 35 },
            2: { cellWidth: 18 },
            3: { cellWidth: 10 },
          },
        });

        // Track the bottom of each column table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colFinalY = (doc as any).lastAutoTable?.finalY || 0;
        if (colFinalY > maxFinalY) maxFinalY = colFinalY;
      }

      // Total section at bottom - positioned below the tallest column
      const finalY = maxFinalY + 5;
      const totalEmployees = employees.length;

      const grandTotal = employees.length; // Grand total = total employee headcount

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        head: [[{ content: "TOTAL", colSpan: 12, styles: { fillColor: [46, 80, 144], textColor: [255, 255, 255], halign: "center", fontSize: 7, fontStyle: "bold" } }, "", "", "", "", "", "", "", "", "", "", ""]],
        body: [[
          { content: "PRESENT:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: totalP.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [0, 176, 80], fillColor: [226, 239, 218], fontSize: 6 } },
          { content: "OFF:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: totalO.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [197, 90, 17], fillColor: [252, 228, 204], fontSize: 6 } },
          { content: "OVERTIME:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: totalOT.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [191, 143, 0], fillColor: [255, 242, 204], fontSize: 6 } },
          { content: "LEAVE:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: totalL.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [255, 0, 0], fillColor: [255, 217, 217], fontSize: 6 } },
          { content: "VACATION:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: totalV.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [0, 112, 192], fillColor: [214, 228, 240], fontSize: 6 } },
          { content: "GRAND TOTAL:", styles: { fontStyle: "bold", halign: "right", fontSize: 6 } },
          { content: grandTotal.toString(), styles: { fontStyle: "bold", halign: "center", textColor: [46, 80, 144], fillColor: [217, 226, 243], fontSize: 6 } },
        ]],
        startY: finalY,
        margin: { left: 5, right: 5 },
        styles: { cellPadding: 1.5, lineWidth: 0.1, lineColor: [200, 200, 200] },
      });

      doc.save(`attendance-${date}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const filteredEmployees = getFilteredEmployees();

  // Group employees by section for display
  const groupedEmployees: { section: string; employees: Employee[] }[] = [];
  let currentSection = "";
  for (const emp of filteredEmployees) {
    if (emp.section !== currentSection) {
      currentSection = emp.section;
      groupedEmployees.push({ section: currentSection, employees: [] });
    }
    groupedEmployees[groupedEmployees.length - 1].employees.push(emp);
  }

  let globalSl = 0;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-600 mr-2">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {GROUP_FILTERS.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                groupFilter === g
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={markAllPresent}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            ✓ Mark All Present
          </button>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button
            onClick={exportPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            📄 Export PDF
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              🗑 Reset Day
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={resetDay}
                className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-3 p-2 rounded-lg text-sm ${saveMessage.includes("failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {saveMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading attendance data...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-10">SL</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Name</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Section</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Location</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-32">Day Off</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-64">Status</th>
              </tr>
            </thead>
            <tbody>
              {groupedEmployees.map((group, gIdx) => {
                const sColor = SECTION_COLORS[group.section] || "#4472C4";
                return [
                  <tr key={`section-${gIdx}-${group.section}`}>
                    <td colSpan={6} className="px-3 py-1.5 font-bold text-white text-xs" style={{ backgroundColor: sColor }}>
                      {group.section} ({group.employees.length})
                    </td>
                  </tr>,
                  ...group.employees.map((emp) => {
                    globalSl++;
                    const status = attendance[emp.id] || "";
                    return (
                      <tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-400 text-xs">{globalSl}</td>
                        <td className="px-3 py-1.5 font-medium text-sm">{emp.name}</td>
                        <td className="px-3 py-1.5 text-gray-500 text-xs">{emp.section}</td>
                        <td className="px-3 py-1.5 text-gray-500 text-xs">{emp.location || "—"}</td>
                        <td className="px-3 py-1.5 text-center">
                          <select
                            value={emp.off_day || ""}
                            onChange={(e) => handleDayOffChange(emp.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day} value={day}>
                                {day || "—"}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex justify-center gap-1">
                            {["P", "OT", "O", "L", "V"].map((s) => {
                              const isActive = status === s;
                              let btnClass = "status-btn bg-gray-100 text-gray-600 border-gray-300";
                              if (isActive) {
                                btnClass = `status-btn active-${s}`;
                              }
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleStatusClick(emp.id, s)}
                                  className={btnClass}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 flex gap-6">
            <span>Total: {filteredEmployees.length}</span>
            <span className="text-green-600">P: {Object.values(attendance).filter((s) => s === "P").length}</span>
            <span className="text-orange-600">OT: {Object.values(attendance).filter((s) => s === "OT").length}</span>
            <span className="text-red-600">O: {Object.values(attendance).filter((s) => s === "O").length}</span>
            <span className="text-blue-600">L: {Object.values(attendance).filter((s) => s === "L").length}</span>
            <span className="text-purple-600">V: {Object.values(attendance).filter((s) => s === "V").length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
