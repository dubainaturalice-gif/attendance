"use client";

import { useState, useEffect, useCallback } from "react";
import { Employee } from "@/lib/types";

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

const FLAT_SECTION_ORDER = [
  "ADMIN", "SALES SUPERVISOR", "JELAT",
  "PRODUCTION HEAD", "HYGIENE DEPT",
  "CLEANER", "ACCOMMODATION",
  "DRIVER - DUBAI", "DRIVER - ABU DHABI", "DRIVER - OTHER EMIRATES", "DRIVER - FUJAIRAH", "DRIVERS", "HOUSE DRIVER",
  "VEHICLE MAINTENANCE",
  "SALESMAN - DUBAI", "SALESMAN - ABU DHABI", "SALESMAN - OTHER EMIRATES", "SALESMAN - FUJAIRAH", "SALESMAN",
  "PRODUCTION UMQ", "UMQ - TECHNICIAN", "UMQ TECHNICIAN",
  "PRODUCTION UMQ NIGHT SHIFT", "FUJAIRAH FACTORY",
  "PRODUCTION", "PROD - LUXURY ICE", "AL QUOZ TECHNICIAN",
  "PROD NIGHT SHIFT", "PROD NIGHT - LUXURY ICE",
];

const GROUP_FILTERS = ["ALL", "OFFICE/ADMIN", "ADMIN", "CLEANER", "DRIVERS", "MECHANIC", "SALESMAN", "UMQ FACTORY", "FACTORY/PRODUCTION", "DUBAI FACTORY", "DUBAI FACTORY NIGHT", "FUJAIRAH FACTORY"];

const DAY_NAME_TO_NUM: Record<string, number> = {
  "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
  "Thursday": 4, "Friday": 5, "Saturday": 6,
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayAbbrev(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day);
  return ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][d.getDay()];
}

function isFriday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 5;
}

function getStatusBg(status: string): string {
  if (status === "P") return "bg-green-100";
  if (status === "OT") return "bg-yellow-100";
  if (status === "O") return "bg-orange-100";
  if (status === "L") return "bg-red-100";
  if (status === "V") return "bg-blue-100";
  return "";
}

function getStatusColor(status: string): string {
  if (status === "P") return "#16a34a";
  if (status === "OT") return "#ca8a04";
  if (status === "O") return "#ea580c";
  if (status === "L") return "#dc2626";
  if (status === "V") return "#2563eb";
  return "";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

export default function MonthlySummary() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<number, Record<string, string>>>({});
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [clearStep, setClearStep] = useState(0);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?month=${monthStr}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setAttendance(data.attendance || {});
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  }, [monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFilteredAndSorted = () => {
    let filtered = employees;
    if (groupFilter !== "ALL") {
      filtered = filtered.filter((e) => e.grp === groupFilter);
    }
    return [...filtered].sort((a, b) => {
      const secA = FLAT_SECTION_ORDER.indexOf(a.section);
      const secB = FLAT_SECTION_ORDER.indexOf(b.section);
      const secAIdx = secA === -1 ? FLAT_SECTION_ORDER.length : secA;
      const secBIdx = secB === -1 ? FLAT_SECTION_ORDER.length : secB;
      if (secAIdx !== secBIdx) return secAIdx - secBIdx;
      return a.name.localeCompare(b.name);
    });
  };

  const sortedEmployees = getFilteredAndSorted();

  const sections: { section: string; grp: string; employees: Employee[] }[] = [];
  let lastSection = "";
  for (const emp of sortedEmployees) {
    if (emp.section !== lastSection) {
      sections.push({ section: emp.section, grp: emp.grp, employees: [] });
      lastSection = emp.section;
    }
    sections[sections.length - 1].employees.push(emp);
  }

  const getEmpStatus = (emp: Employee, day: number): string => {
    const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
    const recorded = attendance[emp.id]?.[dateStr] || "";
    if (emp.on_vacation) {
      if (!recorded || recorded === "P" || recorded === "O") return "V";
      return recorded;
    }
    if (emp.off_day && DAY_NAME_TO_NUM[emp.off_day] !== undefined) {
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek === DAY_NAME_TO_NUM[emp.off_day]) {
        if (!recorded || recorded === "P") return "O";
      }
    }
    if (recorded) return recorded;
    return "";
  };

  const getEmpSummary = (emp: Employee) => {
    let p = 0, ot = 0, o = 0, l = 0, v = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const status = getEmpStatus(emp, d);
      if (status === "P") p++;
      if (status === "OT") ot++;
      if (status === "O") o++;
      if (status === "L") l++;
      if (status === "V") v++;
    }
    return { p, ot, o, l, v, total: p + ot + o };
  };

  const monthlyTotals = { p: 0, ot: 0, o: 0, l: 0, v: 0 };
  sortedEmployees.forEach((emp) => {
    const s = getEmpSummary(emp);
    monthlyTotals.p += s.p;
    monthlyTotals.ot += s.ot;
    monthlyTotals.o += s.o;
    monthlyTotals.l += s.l;
    monthlyTotals.v += s.v;
  });

  const clearAllMonthly = async () => {
    if (clearStep === 0) {
      setClearStep(1);
      return;
    }
    try {
      const res = await fetch(`/api/attendance?month=${monthStr}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        setClearStep(0);
      } else {
        alert("Failed to clear monthly data");
        setClearStep(0);
      }
    } catch (error) {
      console.error("Failed to clear:", error);
      setClearStep(0);
    }
  };

  const exportPDF = async () => {
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      await import("jspdf-autotable");

      const totalRows = sortedEmployees.length + sections.length + 2;
      const rowHeight = 6;
      const headerHeight = 10;
      const titleHeight = 14;
      const bottomMargin = 5;
      const neededHeight = titleHeight + headerHeight + (totalRows * rowHeight) + bottomMargin + 20;
      const pageHeight = Math.max(300, neededHeight);

      const pageWidth = 420;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageWidth, pageHeight] });

      const title = `STAFF ATTENDANCE \u2014 ${monthNames[month - 1].toUpperCase()} ${year} | MONTHLY SUMMARY`;
      doc.setFontSize(10);
      doc.setTextColor(46, 80, 144);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageWidth / 2, 10, { align: "center" });

      const head: { content: string; styles: Record<string, unknown> }[][] = [];
      const body: (string | { content: string; styles: Record<string, unknown> })[][] = [];

      const headerRow: { content: string; styles: Record<string, unknown> }[] = [
        { content: "SECTION", styles: { fillColor: [46, 80, 144], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5 } },
        { content: "EMPLOYEE", styles: { fillColor: [46, 80, 144], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5 } },
        { content: "LOC", styles: { fillColor: [46, 80, 144], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5 } },
      ];

      for (let d = 1; d <= daysInMonth; d++) {
        const abbrev = getDayAbbrev(year, month, d);
        const friday = isFriday(year, month, d);
        headerRow.push({
          content: `${d}
${abbrev}`,
          styles: {
            fillColor: friday ? [255, 243, 224] : [46, 80, 144],
            textColor: friday ? [230, 81, 0] : [255, 255, 255],
            fontStyle: "bold",
            fontSize: 3.5,
            halign: "center",
          },
        });
      }
      headerRow.push({ content: "P", styles: { fillColor: [0, 176, 80], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      headerRow.push({ content: "OT", styles: { fillColor: [255, 192, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      headerRow.push({ content: "O", styles: { fillColor: [255, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      headerRow.push({ content: "L", styles: { fillColor: [0, 112, 192], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      headerRow.push({ content: "V", styles: { fillColor: [112, 48, 160], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      headerRow.push({ content: "TOTAL", styles: { fillColor: [46, 80, 144], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4.5, halign: "center" } });
      head.push(headerRow);

      for (const sec of sections) {
        const sColor = hexToRgb(SECTION_COLORS[sec.section] || "#4472C4");
        const totalCols = 3 + daysInMonth + 6;

        const sepRow: (string | { content: string; styles: Record<string, unknown> })[] = [];
        sepRow.push({ content: `\u2014 ${sec.section} \u2014`, colSpan: totalCols, styles: { fillColor: sColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 4, halign: "left" } });
        for (let i = 1; i < totalCols; i++) sepRow.push("");
        body.push(sepRow);

        for (const emp of sec.employees) {
          const row: (string | { content: string; styles: Record<string, unknown> })[] = [
            { content: sec.section, styles: { fontSize: 3.5, textColor: [100, 100, 100] } },
            { content: emp.name, styles: { fontSize: 4 } },
            { content: emp.location || "", styles: { fontSize: 3.5 } },
          ];

          for (let d = 1; d <= daysInMonth; d++) {
            const status = getEmpStatus(emp, d);
            const friday = isFriday(year, month, d);
            let textColor: [number, number, number] = [0, 0, 0];
            let bgColor: [number, number, number] | undefined = friday ? [255, 248, 225] : undefined;
            if (status === "P") { textColor = [255, 255, 255]; bgColor = [0, 176, 80]; }
            else if (status === "OT") { textColor = [0, 0, 0]; bgColor = [255, 192, 0]; }
            else if (status === "O") { textColor = [255, 255, 255]; bgColor = [255, 165, 0]; }
            else if (status === "L") { textColor = [255, 255, 255]; bgColor = [220, 38, 38]; }
            else if (status === "V") { textColor = [255, 255, 255]; bgColor = [37, 99, 235]; }

            row.push({
              content: status || "",
              styles: {
                fontSize: 3.5,
                halign: "center",
                textColor: textColor,
                fontStyle: status ? "bold" : "normal",
                fillColor: bgColor,
              } as Record<string, unknown>,
            });
          }

          const summary = getEmpSummary(emp);
          row.push({ content: summary.p ? summary.p.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold", textColor: [255, 255, 255], fillColor: summary.p ? [0, 176, 80] : undefined } });
          row.push({ content: summary.ot ? summary.ot.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold", textColor: [0, 0, 0], fillColor: summary.ot ? [255, 192, 0] : undefined } });
          row.push({ content: summary.o ? summary.o.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold", textColor: [255, 255, 255], fillColor: summary.o ? [255, 165, 0] : undefined } });
          row.push({ content: summary.l ? summary.l.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold", textColor: [255, 255, 255], fillColor: summary.l ? [220, 38, 38] : undefined } });
          row.push({ content: summary.v ? summary.v.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold", textColor: [255, 255, 255], fillColor: summary.v ? [37, 99, 235] : undefined } });
          row.push({ content: summary.total ? summary.total.toString() : "", styles: { fontSize: 4, halign: "center", fontStyle: "bold" } });
          body.push(row);
        }
      }

      const totalsRow: (string | { content: string; styles: Record<string, unknown> })[] = [
        { content: "MONTHLY TOTALS", colSpan: 3, styles: { fontStyle: "bold", fontSize: 4.5, fillColor: [217, 226, 243] } },
        "", "",
      ];
      for (let d = 1; d <= daysInMonth; d++) {
        let dayCount = 0;
        sortedEmployees.forEach((emp) => { if (getEmpStatus(emp, d)) dayCount++; });
        const friday = isFriday(year, month, d);
        totalsRow.push({
          content: dayCount ? dayCount.toString() : "",
          styles: { fontSize: 3.5, halign: "center", fontStyle: "bold", fillColor: friday ? [255, 243, 224] : [217, 226, 243] },
        });
      }
      totalsRow.push({ content: monthlyTotals.p.toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", textColor: [0, 176, 80], fillColor: [217, 226, 243] } });
      totalsRow.push({ content: monthlyTotals.ot.toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", textColor: [255, 192, 0], fillColor: [217, 226, 243] } });
      totalsRow.push({ content: monthlyTotals.o.toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", textColor: [255, 0, 0], fillColor: [217, 226, 243] } });
      totalsRow.push({ content: monthlyTotals.l.toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", textColor: [0, 112, 192], fillColor: [217, 226, 243] } });
      totalsRow.push({ content: monthlyTotals.v.toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", textColor: [112, 48, 160], fillColor: [217, 226, 243] } });
      totalsRow.push({ content: (monthlyTotals.p + monthlyTotals.ot + monthlyTotals.o).toString(), styles: { fontSize: 4.5, halign: "center", fontStyle: "bold", fillColor: [217, 226, 243] } });
      body.push(totalsRow);

      const dayColWidth = (pageWidth - 20 - 30 - 45 - 25 - 6 * 10) / daysInMonth;
      const colWidths = [30, 45, 25];
      for (let d = 0; d < daysInMonth; d++) colWidths.push(dayColWidth);
      colWidths.push(10, 10, 10, 10, 10, 12);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        head: head,
        body: body,
        startY: 14,
        margin: { left: 5, right: 5, top: 14, bottom: 5 },
        styles: {
          fontSize: 3.5,
          cellPadding: 0.8,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: [46, 80, 144],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: colWidths.reduce((acc: Record<number, { cellWidth: number }>, w, i) => {
          acc[i] = { cellWidth: w };
          return acc;
        }, {}),
        tableWidth: "auto",
        didParseCell: function(data: { section: string; row: { index: number }; cell: { styles: Record<string, unknown> } }) {
          if (data.section === "body") {
            data.cell.styles.minCellHeight = 4;
          }
        },
      });

      doc.save(`attendance-monthly-${monthStr}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF export failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
            onClick={clearAllMonthly}
            onBlur={() => setTimeout(() => setClearStep(0), 200)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              clearStep === 0
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-red-700 text-white animate-pulse"
            }`}
          >
            {clearStep === 0 ? "\ud83d\uddd1\ufe0f Clear All Monthly" : "\u26a0\ufe0f Click to Confirm"}
          </button>
          <button
            onClick={exportPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            \ud83d\udcc4 Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading monthly data...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <table className="text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-900 text-white">
                <th className="px-2 py-1.5 text-left sticky left-0 bg-blue-900 z-20 min-w-[80px]">Section</th>
                <th className="px-2 py-1.5 text-left sticky left-[80px] bg-blue-900 z-20 min-w-[120px]">Employee</th>
                <th className="px-2 py-1.5 text-left min-w-[60px]">Loc</th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const abbrev = getDayAbbrev(year, month, d);
                  const friday = isFriday(year, month, d);
                  return (
                    <th
                      key={d}
                      className={`px-1 py-1.5 text-center min-w-[28px] ${friday ? "bg-orange-100 text-orange-800" : ""}`}
                    >
                      <div>{d}</div>
                      <div className="text-[9px] font-normal">{abbrev}</div>
                    </th>
                  );
                })}
                <th className="px-1.5 py-1.5 text-center bg-green-700 min-w-[28px]">P</th>
                <th className="px-1.5 py-1.5 text-center bg-yellow-500 min-w-[28px]">OT</th>
                <th className="px-1.5 py-1.5 text-center bg-orange-600 min-w-[28px]">O</th>
                <th className="px-1.5 py-1.5 text-center bg-red-600 min-w-[28px]">L</th>
                <th className="px-1.5 py-1.5 text-center bg-blue-600 min-w-[28px]">V</th>
                <th className="px-1.5 py-1.5 text-center bg-blue-900 min-w-[32px]">TOT</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec, secIdx) => {
                const sColor = SECTION_COLORS[sec.section] || "#4472C4";
                return [
                  <tr key={`sec-${secIdx}-${sec.section}`}>
                    <td
                      colSpan={3 + daysInMonth + 6}
                      className="px-2 py-1 font-bold text-white text-xs"
                      style={{ backgroundColor: sColor }}
                    >
                      {sec.section}
                    </td>
                  </tr>,
                  ...sec.employees.map((emp) => {
                    const summary = getEmpSummary(emp);
                    return (
                      <tr key={emp.id} className={`border-b hover:bg-gray-50 ${emp.on_vacation ? "bg-blue-50" : ""}`}>
                        <td className="px-2 py-1 text-gray-400 sticky left-0 bg-white text-[10px]">{emp.section}</td>
                        <td className="px-2 py-1 font-medium sticky left-[80px] bg-white">
                          {emp.name}
                          {emp.on_vacation && <span className="ml-1 text-[9px] text-blue-600 font-bold">[V]</span>}
                        </td>
                        <td className="px-2 py-1 text-gray-500">{emp.location || ""}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const d = i + 1;
                          const status = getEmpStatus(emp, d);
                          const friday = isFriday(year, month, d);
                          return (
                            <td
                              key={d}
                              className={`px-0.5 py-1 text-center font-bold ${friday ? "bg-orange-50" : ""} ${getStatusBg(status)}`}
                              style={{ color: getStatusColor(status) }}
                            >
                              {status || ""}
                            </td>
                          );
                        })}
                        <td className="px-1 py-1 text-center font-bold text-green-600">{summary.p || ""}</td>
                        <td className="px-1 py-1 text-center font-bold text-yellow-600">{summary.ot || ""}</td>
                        <td className="px-1 py-1 text-center font-bold text-orange-600">{summary.o || ""}</td>
                        <td className="px-1 py-1 text-center font-bold text-red-600">{summary.l || ""}</td>
                        <td className="px-1 py-1 text-center font-bold text-blue-600">{summary.v || ""}</td>
                        <td className="px-1 py-1 text-center font-bold">{summary.total || ""}</td>
                      </tr>
                    );
                  }),
                ];
              })}
              <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                <td colSpan={3} className="px-2 py-1.5 sticky left-0 bg-blue-50">MONTHLY TOTALS</td>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  let dayCount = 0;
                  sortedEmployees.forEach((emp) => {
                    if (getEmpStatus(emp, d)) dayCount++;
                  });
                  const friday = isFriday(year, month, d);
                  return (
                    <td key={d} className={`px-0.5 py-1.5 text-center ${friday ? "bg-orange-100" : ""}`}>
                      {dayCount || ""}
                    </td>
                  );
                })}
                <td className="px-1 py-1.5 text-center text-green-600">{monthlyTotals.p}</td>
                <td className="px-1 py-1.5 text-center text-orange-600">{monthlyTotals.ot}</td>
                <td className="px-1 py-1.5 text-center text-red-600">{monthlyTotals.o}</td>
                <td className="px-1 py-1.5 text-center text-blue-600">{monthlyTotals.l}</td>
                <td className="px-1 py-1.5 text-center text-purple-600">{monthlyTotals.v}</td>
                <td className="px-1 py-1.5 text-center">{monthlyTotals.p + monthlyTotals.ot + monthlyTotals.o}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
