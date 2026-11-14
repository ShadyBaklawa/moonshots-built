// Bundled, editable category-to-verdict rule table for Seat Shed.
// verdict: "replaceable" | "partial" | "keep"
window.CATEGORY_RULES = [
  {
    key: "dashboards",
    label: "Dashboards / BI reporting",
    verdict: "replaceable",
    reason: "AI assistants now build live data dashboards straight from a chat prompt."
  },
  {
    key: "whiteboard",
    label: "Whiteboard / diagramming",
    verdict: "replaceable",
    reason: "AI-built whiteboards cover basic diagrams, flowcharts and brainstorm boards."
  },
  {
    key: "forms",
    label: "Forms / surveys",
    verdict: "replaceable",
    reason: "An AI assistant can generate a form and tally results without a dedicated builder."
  },
  {
    key: "spreadsheets",
    label: "Spreadsheets / reporting add-ons",
    verdict: "replaceable",
    reason: "AI-built spreadsheets now handle most ad-hoc reporting and calculation work."
  },
  {
    key: "notes",
    label: "Notes / simple docs",
    verdict: "partial",
    reason: "AI assistants draft and summarize notes well, but real-time multi-editor polish lags."
  },
  {
    key: "slides",
    label: "Slide decks / presentations",
    verdict: "partial",
    reason: "AI can draft slide content, but brand templates and animation still need a dedicated tool."
  },
  {
    key: "meetings",
    label: "Meeting notes / transcription",
    verdict: "partial",
    reason: "AI meeting tools capture notes well but may miss niche integrations your team relies on."
  },
  {
    key: "pm",
    label: "Project management",
    verdict: "keep",
    reason: "Task dependencies, timelines and team permissions still need a dedicated PM tool."
  },
  {
    key: "chat",
    label: "Team chat / messaging",
    verdict: "keep",
    reason: "Always-on team chat and notifications aren't replaced by an AI assistant workspace."
  },
  {
    key: "email",
    label: "Email hosting",
    verdict: "keep",
    reason: "Company email hosting and deliverability sit outside an AI assistant workspace."
  },
  {
    key: "calendar",
    label: "Calendar / scheduling",
    verdict: "keep",
    reason: "Company-wide calendar sync isn't something an AI assistant replaces."
  },
  {
    key: "design",
    label: "Design / creative",
    verdict: "keep",
    reason: "Pixel-precise design and brand work still needs dedicated creative software."
  },
  {
    key: "crm",
    label: "CRM / sales",
    verdict: "keep",
    reason: "Pipeline tracking and sales automation need a dedicated CRM system."
  },
  {
    key: "video",
    label: "Video conferencing",
    verdict: "keep",
    reason: "Live video calls need dedicated conferencing infrastructure."
  },
  {
    key: "security",
    label: "Password manager / security",
    verdict: "keep",
    reason: "Credential security should stay separate from any AI assistant workspace."
  },
  {
    key: "devtools",
    label: "Developer tools",
    verdict: "keep",
    reason: "Code repositories and CI/CD need dedicated, specialized developer tooling."
  },
  {
    key: "hr",
    label: "HR / payroll",
    verdict: "keep",
    reason: "Regulated HR and payroll data need dedicated, compliant systems."
  },
  {
    key: "other",
    label: "Other / not listed",
    verdict: "keep",
    reason: "No rule matched this category yet — reviewed manually. Click the verdict to change it."
  }
];
