import { Download, Printer, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportTreatmentsToCSV,
  exportDiagnosticsToCSV,
  exportPatientReportToCSV,
  printPatientReport,
  printCurrentPage,
} from "@/utils/export";
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

interface ExportMenuProps {
  patient: Patient;
  treatments: TreatmentExport[];
  diagnostics: DiagnosticExport[];
}

export function ExportMenu({ patient, treatments, diagnostics }: ExportMenuProps) {
  const handleExportTreatmentsCSV = () => {
    exportTreatmentsToCSV(patient.name, treatments);
  };

  const handleExportDiagnosticsCSV = () => {
    exportDiagnosticsToCSV(patient.name, diagnostics);
  };

  const handleExportFullReportCSV = () => {
    exportPatientReportToCSV({ patient, treatments, diagnostics });
  };

  const handlePrintReport = () => {
    printPatientReport({ patient, treatments, diagnostics });
  };

  const handlePrintPage = () => {
    printCurrentPage();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 no-print">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* CSV Exports */}
        <DropdownMenuItem onClick={handleExportFullReportCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Full Report (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportTreatmentsCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Treatments Only (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportDiagnosticsCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Diagnostics Only (CSV)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Print Options */}
        <DropdownMenuLabel>Print</DropdownMenuLabel>
        <DropdownMenuItem onClick={handlePrintReport} className="gap-2">
          <FileText className="h-4 w-4" />
          Print Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintPage} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Current Page
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
