import type { TourStep } from "@/components/GuidedTour";

// Dashboard Tour Steps
export const dashboardTourSteps: TourStep[] = [
  {
    target: "",
    title: "Welcome to BioTrack!",
    content: "Let's take a quick tour to help you get started with tracking patient treatments and diagnostics.",
    placement: "center",
  },
  {
    target: "[data-tour='stats-overview']",
    title: "Quick Stats Overview",
    content: "See your team's key metrics at a glance - total patients, active treatments, and patients requiring attention.",
    placement: "bottom",
    spotlightPadding: 12,
  },
  {
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    content: "Access common tasks quickly. Add new patients, view alerts, or manage your team settings from here.",
    placement: "bottom",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='recent-activity']",
    title: "Recent Activity",
    content: "Stay informed about what's happening in your team. See recent patient updates and treatment changes.",
    placement: "left",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='sidebar-nav']",
    title: "Navigation Sidebar",
    content: "Use the sidebar to navigate between Dashboard, Patients, and Settings. You can collapse it for more space.",
    placement: "right",
    spotlightPadding: 8,
  },
];

// Patients Page Tour Steps
export const patientsTourSteps: TourStep[] = [
  {
    target: "[data-tour='patients-header']",
    title: "Patients Overview",
    content: "This is your main view for managing all patients. You can see everyone's status at a glance.",
    placement: "bottom",
  },
  {
    target: "[data-tour='search-filter']",
    title: "Search & Filter",
    content: "Quickly find patients by name, RUT, or filter by unit (UCI/UTI) and treatment status.",
    placement: "bottom",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='add-patient-btn']",
    title: "Add New Patient",
    content: "Click here to register a new patient. You'll enter their basic info and assign them to a bed.",
    placement: "left",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='patient-card']",
    title: "Patient Cards",
    content: "Each card shows key patient info. Click to view details, or use the action buttons for quick updates.",
    placement: "bottom",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='ending-soon']",
    title: "Treatments Ending Soon",
    content: "Orange highlighted cards indicate treatments ending in 1 day. Plan ahead for these patients!",
    placement: "top",
  },
];

// Patient Detail Tour Steps
export const patientDetailTourSteps: TourStep[] = [
  {
    target: "[data-tour='patient-info']",
    title: "Patient Information",
    content: "View and export the patient's basic information including unit assignment and treatment status.",
    placement: "bottom",
  },
  {
    target: "[data-tour='treatment-section']",
    title: "Treatment Records",
    content: "Manage antibiotic treatments here. Add new programs, apply daily doses, suspend or extend treatments.",
    placement: "bottom",
    spotlightPadding: 12,
  },
  {
    target: "[data-tour='treatment-actions']",
    title: "Treatment Actions",
    content: "Use 'Apply Day' to record a dose, 'Suspend' to pause treatment, or 'Extend' to add more days.",
    placement: "left",
  },
  {
    target: "[data-tour='diagnostics-section']",
    title: "Diagnostics",
    content: "Track patient diagnoses with severity levels. Add new diagnostics as they're identified.",
    placement: "top",
  },
  {
    target: "[data-tour='notes-section']",
    title: "Patient Notes",
    content: "Add categorized notes for team communication. Pin important notes and filter by category.",
    placement: "top",
  },
  {
    target: "[data-tour='timeline-section']",
    title: "Treatment Timeline",
    content: "Visualize treatment history over time. Use zoom controls to see different time ranges.",
    placement: "top",
  },
];

// Command Palette Tour (mini-tour for keyboard shortcuts)
export const commandPaletteTourSteps: TourStep[] = [
  {
    target: "",
    title: "Command Palette",
    content: "Press Cmd+K (Mac) or Ctrl+K (Windows) anytime to open the command palette for quick navigation and actions.",
    placement: "center",
  },
];

// Export tour IDs for consistency
export const TOUR_IDS = {
  dashboard: "dashboard-tour",
  patients: "patients-tour",
  patientDetail: "patient-detail-tour",
  commandPalette: "command-palette-tour",
} as const;
