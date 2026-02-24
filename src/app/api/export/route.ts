import { generatePdf } from "@/lib/export/pdf-generator";
import { generateCsv } from "@/lib/export/csv-generator";
import type { ValidatedName } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { names, format }: { names: ValidatedName[]; format: "pdf" | "csv" } =
      await req.json();

    if (format === "csv") {
      const csv = generateCsv(names);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=name-generator-results.csv",
        },
      });
    }

    if (format === "pdf") {
      const pdfBytes = generatePdf(names);
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=name-generator-report.pdf",
        },
      });
    }

    return Response.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
