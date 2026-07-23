import { describe, expect, it } from "vitest";
import { normalizeDirective } from "../src/modules/directives/normalize.js";

describe("normalizeDirective", () => {
  it("marks malformed payloads and missing dates as anomalies", () => {
    const result = normalizeDirective({
      id: "directive-1",
      authorityId: "authority-1",
      title: "Test directive",
      summary: "Summary",
      riskLevel: "HIGH",
      effectiveDate: null,
      rawPayload: {
        schemaVersion: "2024.experimental"
      },
      authority: {
        id: "authority-1",
        code: "FDA",
        name: "FDA",
        region: "US",
        website: "https://www.fda.gov"
      },
      actionItems: [
        {
          id: "action-1",
          directiveId: "directive-1",
          title: "Review impact",
          assignedTo: "Maya Chen",
          status: "RESOLVED",
          priority: "HIGH",
          dueDate: new Date("2026-07-10T00:00:00.000Z"),
          flagReason: null
        }
      ]
    });

    expect(result.hasAnomaly).toBe(true);
    expect(result.health).toBe("CORRUPT_PAYLOAD");
    expect(result.anomalies).toContain("Missing effective date");
    expect(result.anomalies).toContain("Conflicting state: resolved item is overdue without resolution notes");
    expect(result.anomalies).toContain("Malformed payload: missing metadata");
  });
});
