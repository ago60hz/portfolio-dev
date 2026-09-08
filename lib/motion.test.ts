import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ACCELERATE,
  BOUNCE_STOPS,
  DURATION,
  ELASTIC_STOPS,
  OVERSHOOT_STOPS,
  SLOW_DOWN,
  SMOOTH,
  STAGGER,
  beat,
  bounce,
  elastic,
  linearEase,
  overshoot,
} from "./motion";

const CSS = readFileSync("app/globals.css", "utf8");

/** Pulls one custom property's value out of the stylesheet. */
const token = (name: string) => {
  const m = CSS.match(new RegExp(`\\s${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} is not defined in app/globals.css`);
  return m[1].trim();
};

const numbers = (value: string) =>
  value
    .slice(value.indexOf("(") + 1, value.lastIndexOf(")"))
    .split(",")
    .map((n) => Number(n.trim()));

describe("linearEase", () => {
  it("pins both endpoints to the table", () => {
    const f = linearEase([0, 0.5, 2, 1]);
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
  });

  it("interpolates linearly between stops, as CSS linear() does", () => {
    const f = linearEase([0, 10, 20]);
    expect(f(0.25)).toBeCloseTo(5, 10);
    expect(f(0.5)).toBeCloseTo(10, 10);
    expect(f(0.75)).toBeCloseTo(15, 10);
  });

  it("clamps outside 0..1 rather than extrapolating", () => {
    const f = linearEase([0, 1]);
    expect(f(-1)).toBe(0);
    expect(f(2)).toBe(1);
  });
});

describe("the preset curves", () => {
  // A mistyped digit in a 101-number table is otherwise invisible: the curve
  // still runs, it just stops being the preset Praise chose.
  it("overshoot peaks at 1.68 and lands on 1", () => {
    expect(Math.max(...OVERSHOOT_STOPS)).toBeCloseTo(1.68, 4);
    expect(overshoot(0)).toBe(0);
    expect(overshoot(1)).toBe(1);
  });

  it("elastic peaks at 1.3055 and lands on 1", () => {
    expect(Math.max(...ELASTIC_STOPS)).toBeCloseTo(1.3055, 4);
    expect(elastic(0)).toBe(0);
    expect(elastic(1)).toBe(1);
  });

  it("bounce never overshoots and lands on 1", () => {
    expect(Math.max(...BOUNCE_STOPS)).toBeCloseTo(1, 4);
    expect(bounce(0)).toBe(0);
    expect(bounce(1)).toBe(1);
  });
});

/**
 * The reason this file reads the stylesheet.
 *
 * The curves exist twice -- once as CSS custom properties for transitions and
 * once here for motion/react, which cannot read a CSS variable as an easing.
 * Two copies of a number drift. These assertions are what stop that.
 */
describe("the CSS tokens and the JS mirrors are the same curves", () => {
  it.each([
    ["--ease-smooth", SMOOTH],
    ["--ease-slow-down", SLOW_DOWN],
    ["--ease-accelerate", ACCELERATE],
  ])("%s", (name, arr) => {
    expect(numbers(token(name))).toEqual([...arr]);
  });

  it.each([
    ["--ease-elastic", ELASTIC_STOPS],
    ["--ease-bounce", BOUNCE_STOPS],
    ["--ease-overshoot", OVERSHOOT_STOPS],
  ])("%s", (name, stops) => {
    expect(numbers(token(name))).toEqual(stops);
  });

  it.each([
    ["--duration-press", DURATION.press],
    ["--duration-state", DURATION.state],
    ["--duration-max", DURATION.max],
    ["--duration-enter", DURATION.enter],
    ["--duration-settle", DURATION.settle],
    ["--duration-drop", DURATION.drop],
    ["--duration-surface", DURATION.surface],
  ])("%s matches DURATION, in seconds", (name, seconds) => {
    expect(parseFloat(token(name))).toBeCloseTo(seconds * 1000, 6);
  });

  it("--stagger matches STAGGER", () => {
    expect(parseFloat(token("--stagger"))).toBeCloseTo(STAGGER * 1000, 6);
  });
});

describe("beat", () => {
  it("spaces a staggered run by one stagger each", () => {
    expect(beat(0)).toBe(0);
    expect(beat(3)).toBeCloseTo(STAGGER * 3, 10);
  });
});
