import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ValidatedName } from "@/lib/types";

export function generatePdf(names: ValidatedName[]): Uint8Array {
  const doc = new jsPDF();
  const sorted = [...names].sort(
    (a, b) =>
      b.validation.trademarkabilityScore.overall -
      a.validation.trademarkabilityScore.overall
  );

  // Title
  doc.setFontSize(20);
  doc.text("Name Generator Report", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`${sorted.length} validated names`, 14, 36);

  // Summary table
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 44,
    head: [["#", "Name", "Score", "Grade", "Type", "Domain", "Summary"]],
    body: sorted.map((n, i) => [
      (i + 1).toString(),
      n.generated.name,
      n.validation.trademarkabilityScore.overall.toString(),
      n.validation.trademarkabilityScore.grade,
      n.generated.distinctivenessCategory,
      n.validation.domain.available
        ? n.validation.domain.price
          ? `Available (${n.validation.domain.price})`
          : "Available"
        : "Taken",
      truncateText(n.validation.trademarkabilityScore.report, 80),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 25, fontStyle: "bold" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
      6: { cellWidth: "auto" },
    },
  });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
