/**
 * Export Utilities (M7.3)
 * Functions for exporting patient data to various formats
 */

import type { Patient } from "@/models/Patients";

interface TreatmentExport {
  id: string;
  antibioticName: string;
  antibioticType: string;
  startDate: string;
  daysApplied: number;
  programmedDays: number;
  status: string;
}

interface DiagnosticExport {
  id: string;
  diagnosisName: string;
  diagnosisCode?: string;
  categoryName?: string;
  dateDiagnosed: string;
  severity: string;
  notes?: string;
  createdBy?: string;
}

interface PatientExportData {
  patient: Patient;
  treatments: TreatmentExport[];
  diagnostics: DiagnosticExport[];
}

/**
 * Convert data to CSV format
 */
function convertToCSV<T>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return "";

  // Header row
  const header = columns.map((col) => `"${col.label}"`).join(",");

  // Data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        // Handle different value types
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return `"${String(value)}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Download a file with the given content
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export patient treatments to CSV
 */
export function exportTreatmentsToCSV(
  patientName: string,
  treatments: TreatmentExport[]
): void {
  const columns: { key: keyof TreatmentExport; label: string }[] = [
    { key: "antibioticName", label: "Antibiotic/Drug" },
    { key: "antibioticType", label: "Type" },
    { key: "startDate", label: "Start Date" },
    { key: "programmedDays", label: "Programmed Days" },
    { key: "daysApplied", label: "Days Applied" },
    { key: "status", label: "Status" },
  ];

  const csv = convertToCSV(treatments, columns);
  const filename = `${patientName.replace(/\s+/g, "_")}_treatments_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

/**
 * Export patient diagnostics to CSV
 */
export function exportDiagnosticsToCSV(
  patientName: string,
  diagnostics: DiagnosticExport[]
): void {
  const columns: { key: keyof DiagnosticExport; label: string }[] = [
    { key: "diagnosisName", label: "Diagnosis" },
    { key: "diagnosisCode", label: "Code" },
    { key: "categoryName", label: "Category" },
    { key: "dateDiagnosed", label: "Date Diagnosed" },
    { key: "severity", label: "Severity" },
    { key: "notes", label: "Notes" },
    { key: "createdBy", label: "Created By" },
  ];

  const csv = convertToCSV(diagnostics, columns);
  const filename = `${patientName.replace(/\s+/g, "_")}_diagnostics_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

/**
 * Export full patient report to CSV
 */
export function exportPatientReportToCSV(data: PatientExportData): void {
  const { patient, treatments, diagnostics } = data;

  // Patient info section
  let csv = "PATIENT REPORT\n";
  csv += `"Generated","${new Date().toLocaleString()}"\n`;
  csv += "\n";
  csv += "PATIENT INFORMATION\n";
  csv += `"Name","${patient.name}"\n`;
  csv += `"RUT","${patient.rut}"\n`;
  csv += `"Unit","${patient.unit}"\n`;
  csv += `"Bed","${patient.bedNumber}"\n`;
  csv += `"Status","${patient.status}"\n`;
  csv += "\n";

  // Treatments section
  csv += "TREATMENTS\n";
  if (treatments.length > 0) {
    const treatmentColumns: { key: keyof TreatmentExport; label: string }[] = [
      { key: "antibioticName", label: "Antibiotic/Drug" },
      { key: "antibioticType", label: "Type" },
      { key: "startDate", label: "Start Date" },
      { key: "programmedDays", label: "Programmed Days" },
      { key: "daysApplied", label: "Days Applied" },
      { key: "status", label: "Status" },
    ];
    csv += convertToCSV(treatments, treatmentColumns);
  } else {
    csv += "No treatments recorded\n";
  }
  csv += "\n";

  // Diagnostics section
  csv += "DIAGNOSTICS\n";
  if (diagnostics.length > 0) {
    const diagnosticColumns: { key: keyof DiagnosticExport; label: string }[] = [
      { key: "diagnosisName", label: "Diagnosis" },
      { key: "diagnosisCode", label: "Code" },
      { key: "categoryName", label: "Category" },
      { key: "dateDiagnosed", label: "Date Diagnosed" },
      { key: "severity", label: "Severity" },
      { key: "notes", label: "Notes" },
    ];
    csv += convertToCSV(diagnostics, diagnosticColumns);
  } else {
    csv += "No diagnostics recorded\n";
  }

  const filename = `${patient.name.replace(/\s+/g, "_")}_full_report_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

/**
 * Export patients list to CSV
 */
export function exportPatientsListToCSV(patients: Patient[]): void {
  const columns: { key: keyof Patient; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "rut", label: "RUT" },
    { key: "unit", label: "Unit" },
    { key: "bedNumber", label: "Bed" },
    { key: "status", label: "Status" },
  ];

  const csv = convertToCSV(patients, columns);
  const filename = `patients_list_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

/**
 * Trigger print dialog for the current page
 */
export function printCurrentPage(): void {
  window.print();
}

/**
 * Generate a printable HTML report for a patient
 */
export function generatePrintableReport(data: PatientExportData): string {
  const { patient, treatments, diagnostics } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Patient Report - ${patient.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          padding: 0.5in;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid #000;
          margin-bottom: 1.5rem;
        }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .report-info { text-align: right; font-size: 10pt; color: #666; }
        h1 { font-size: 20pt; margin-bottom: 0.5rem; }
        h2 { font-size: 14pt; margin: 1.5rem 0 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #ccc; }
        .patient-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .info-item { display: flex; gap: 0.5rem; }
        .info-label { font-weight: 600; color: #666; min-width: 80px; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 10pt; }
        th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 9pt; font-weight: 500; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-suspended { background: #fef9c3; color: #854d0e; }
        .badge-finished { background: #e5e7eb; color: #374151; }
        .badge-mild { background: #dcfce7; color: #166534; }
        .badge-moderate { background: #fef9c3; color: #854d0e; }
        .badge-severe { background: #fed7aa; color: #c2410c; }
        .badge-critical { background: #fecaca; color: #dc2626; }
        .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 9pt; color: #666; text-align: center; }
        @media print {
          body { padding: 0; }
          @page { margin: 0.5in; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">BioTrack</div>
        <div class="report-info">
          <div>Patient Report</div>
          <div>Generated: ${new Date().toLocaleString()}</div>
        </div>
      </div>

      <h1>${patient.name}</h1>
      <div class="patient-info">
        <div class="info-item"><span class="info-label">RUT:</span> ${patient.rut}</div>
        <div class="info-item"><span class="info-label">Unit:</span> ${patient.unit}</div>
        <div class="info-item"><span class="info-label">Bed:</span> ${patient.bedNumber}</div>
        <div class="info-item"><span class="info-label">Status:</span> <span class="badge badge-${patient.status}">${patient.status}</span></div>
      </div>

      <h2>Treatments (${treatments.length})</h2>
      ${
        treatments.length > 0
          ? `
        <table>
          <thead>
            <tr>
              <th>Antibiotic/Drug</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${treatments
              .map(
                (t) => `
              <tr>
                <td>${t.antibioticName}</td>
                <td>${t.antibioticType}</td>
                <td>${new Date(t.startDate).toLocaleDateString()}</td>
                <td>${t.daysApplied}/${t.programmedDays}</td>
                <td><span class="badge badge-${t.status}">${t.status}</span></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>No treatments recorded</p>"
      }

      <h2>Diagnostics (${diagnostics.length})</h2>
      ${
        diagnostics.length > 0
          ? `
        <table>
          <thead>
            <tr>
              <th>Diagnosis</th>
              <th>Category</th>
              <th>Date</th>
              <th>Severity</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${diagnostics
              .map(
                (d) => `
              <tr>
                <td>${d.diagnosisName}${d.diagnosisCode ? ` (${d.diagnosisCode})` : ""}</td>
                <td>${d.categoryName || "-"}</td>
                <td>${new Date(d.dateDiagnosed).toLocaleDateString()}</td>
                <td><span class="badge badge-${d.severity}">${d.severity}</span></td>
                <td>${d.notes || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
          : "<p>No diagnostics recorded</p>"
      }

      <div class="footer">
        <p>This report was generated by BioTrack - Hospital Infection Control System</p>
        <p>Confidential medical information - Handle according to hospital policy</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Open printable report in a new window and trigger print
 */
export function printPatientReport(data: PatientExportData): void {
  const html = generatePrintableReport(data);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}
