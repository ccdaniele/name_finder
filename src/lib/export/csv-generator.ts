import type { ValidatedName } from "@/lib/types";

export function generateCsv(names: ValidatedName[]): string {
  const headers = [
    "Name",
    "Score",
    "Grade",
    "Distinctiveness",
    "Domain Available",
    "Domain Price",
    "Rationale",
    "Trademark Conflicts",
    "Risk Level",
    "Report",
  ];

  const rows = names.map((n) => [
    n.generated.name,
    n.validation.trademarkabilityScore.overall.toString(),
    n.validation.trademarkabilityScore.grade,
    n.generated.distinctivenessCategory,
    n.validation.domain.available ? "Yes" : "No",
    n.validation.domain.price || "N/A",
    escapeCsvField(n.generated.rationale),
    n.validation.trademark.conflicts.length.toString(),
    n.validation.trademark.riskLevel,
    escapeCsvField(n.validation.trademarkabilityScore.report),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
