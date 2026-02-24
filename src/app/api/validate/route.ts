import { validateSingleName } from "@/lib/validation/pipeline";
import type { GeneratedName, PreferenceSummary } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const {
      generated,
      preferenceSummary,
    }: {
      generated: GeneratedName;
      preferenceSummary: PreferenceSummary;
    } = await req.json();

    const usptoClasses = preferenceSummary.usptoClasses.map(
      (c) => c.classNumber
    );

    const result = await validateSingleName(
      generated,
      usptoClasses,
      preferenceSummary.industry
    );

    return Response.json(result);
  } catch (error) {
    console.error("Validation error:", error);
    return Response.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
