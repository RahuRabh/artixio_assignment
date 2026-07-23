import { describe, expect, it } from "vitest";
import { assertValidStatusTransition } from "../src/modules/action-items/transitions.js";

describe("assertValidStatusTransition", () => {
  it("allows valid transitions", () => {
    expect(() => assertValidStatusTransition("PENDING", "IN_REVIEW")).not.toThrow();
    expect(() => assertValidStatusTransition("IN_REVIEW", "RESOLVED")).not.toThrow();
  });

  it("rejects invalid transitions", () => {
    expect(() => assertValidStatusTransition("RESOLVED", "PENDING")).toThrow();
    expect(() => assertValidStatusTransition("PENDING", "RESOLVED")).toThrow();
  });
});

