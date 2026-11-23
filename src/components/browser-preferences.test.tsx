import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Run mount effects and event handlers with the repository's node-only runner.
const lifecycle = vi.hoisted(() => ({
  values: [] as unknown[],
  cursor: 0,
  collectEffects: true,
  effects: [] as Array<() => void>,
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void) => {
    if (lifecycle.collectEffects) lifecycle.effects.push(effect);
  },
  useState: (initial: unknown) => {
    const index = lifecycle.cursor++;
    if (!(index in lifecycle.values)) lifecycle.values[index] = initial;
    return [lifecycle.values[index], (value: unknown) => { lifecycle.values[index] = value; }];
  },
}));

import { ThemeToggle } from "./theme-toggle";
import { OnboardingTooltip } from "./onboarding-tooltip";

function render(component: () => ReactElement) {
  lifecycle.cursor = 0;
  return component();
}

function mount(component: () => ReactElement) {
  render(component);
  lifecycle.collectEffects = false;
  for (const effect of lifecycle.effects.splice(0)) effect();
  return render(component);
}

function button(node: ReactNode, label: string): ReactElement<{ onClick: () => void }> {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ "aria-label"?: string; children?: ReactNode; onClick: () => void }>(child)) continue;
    if (child.type === "button" && child.props["aria-label"] === label) return child;
    if (child.props.children) {
      try { return button(child.props.children, label); } catch { /* Search the next sibling. */ }
    }
  }
  throw new Error(`Missing button: ${label}`);
}

const theme = () => ThemeToggle({});
const tooltip = () => OnboardingTooltip({ id: "sample-help", text: "Helpful guidance", children: <button>Open</button> });
let classes: Set<string>;
let browserDocument: { documentElement: { classList: { contains: (name: string) => boolean; toggle: (name: string, enabled: boolean) => void }; style: { colorScheme: string } }; cookie: string };
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

function unavailableStorage(mode: string) {
  if (mode === "null") vi.stubGlobal("localStorage", null);
  if (mode === "denied getter") {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => { throw new DOMException("Access denied", "SecurityError"); },
    });
  }
  if (mode === "denied read") storage.getItem.mockImplementation(() => { throw new DOMException("Access denied", "SecurityError"); });
  if (mode === "denied write") storage.setItem.mockImplementation(() => { throw new DOMException("Storage full", "QuotaExceededError"); });
}

beforeEach(() => {
  lifecycle.values = []; lifecycle.cursor = 0; lifecycle.collectEffects = true; lifecycle.effects = [];
  classes = new Set();
  browserDocument = {
    documentElement: {
      classList: {
        contains: (name) => classes.has(name),
        toggle: (name, enabled) => { if (enabled) classes.add(name); else classes.delete(name); },
      },
      style: { colorScheme: "light" },
    },
    cookie: "",
  };
  storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { get localStorage() { return globalThis.localStorage; } });
  vi.stubGlobal("document", browserDocument);
});

afterEach(() => vi.unstubAllGlobals());

describe("theme without browser storage", () => {
  it.each(["null", "denied getter", "denied read", "denied write"])(
    "mounts and switches both ways with %s storage",
    (mode) => {
      unavailableStorage(mode);
      classes.add("dark");
      browserDocument.documentElement.style.colorScheme = "dark";
      const mounted = mount(theme);
      button(mounted, "Switch to light mode").props.onClick();
      expect(classes.has("dark")).toBe(false);
      expect(browserDocument.documentElement.style.colorScheme).toBe("light");
      expect(browserDocument.cookie).toContain("rt-theme=light;");
      button(render(theme), "Switch to dark mode").props.onClick();
      expect(classes.has("dark")).toBe(true);
      expect(browserDocument.documentElement.style.colorScheme).toBe("dark");
    },
  );

  it("uses the theme already resolved before hydration when storage disagrees", () => {
    classes.add("dark");
    browserDocument.documentElement.style.colorScheme = "dark";
    storage.getItem.mockReturnValue("light");
    expect(button(mount(theme), "Switch to light mode")).toBeDefined();
  });

  it("switches for the current page when both storage and cookies are blocked", () => {
    unavailableStorage("null");
    Object.defineProperty(browserDocument, "cookie", {
      get: () => { throw new DOMException("Access denied", "SecurityError"); },
      set: () => { throw new DOMException("Access denied", "SecurityError"); },
    });
    button(mount(theme), "Switch to dark mode").props.onClick();
    expect(classes.has("dark")).toBe(true);
    expect(browserDocument.documentElement.style.colorScheme).toBe("dark");
    button(render(theme), "Switch to light mode").props.onClick();
    expect(classes.has("dark")).toBe(false);
  });

  it("still saves the preference when browser storage is available", () => {
    button(mount(theme), "Switch to dark mode").props.onClick();
    expect(storage.setItem).toHaveBeenCalledWith("rt-theme", "dark");
    expect(browserDocument.cookie).toBe("rt-theme=dark; path=/; max-age=31536000; SameSite=Lax");
    expect(classes.has("dark")).toBe(true);
  });

  it("still switches and saves storage when cookie writes are rejected", () => {
    Object.defineProperty(browserDocument, "cookie", {
      set: () => { throw new DOMException("Access denied", "SecurityError"); },
    });
    button(mount(theme), "Switch to dark mode").props.onClick();
    expect(storage.setItem).toHaveBeenCalledWith("rt-theme", "dark");
    expect(classes.has("dark")).toBe(true);
    expect(browserDocument.documentElement.style.colorScheme).toBe("dark");
  });

  it("reserves the server-rendered placeholder without accessing browser APIs", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const markup = renderToStaticMarkup(render(theme));
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("<button");
    expect(lifecycle.effects).toHaveLength(1);
  });
});

describe("onboarding without browser storage", () => {
  it.each(["null", "denied getter", "denied read", "denied write"])(
    "shows and dismisses guidance with %s storage",
    (mode) => {
      unavailableStorage(mode);
      const mounted = mount(tooltip);
      expect(renderToStaticMarkup(mounted)).toContain('role="tooltip"');
      button(mounted, "Dismiss").props.onClick();
      const dismissed = renderToStaticMarkup(render(tooltip));
      expect(dismissed).not.toContain('role="tooltip"');
      expect(dismissed).toContain("Open");
    },
  );

  it("keeps previously dismissed guidance hidden", () => {
    storage.getItem.mockReturnValue("1");
    expect(renderToStaticMarkup(mount(tooltip))).not.toContain('role="tooltip"');
    expect(storage.getItem).toHaveBeenCalledWith("tooltip:sample-help");
  });

  it("remembers dismissal when storage is available", () => {
    button(mount(tooltip), "Dismiss").props.onClick();
    expect(storage.setItem).toHaveBeenCalledWith("tooltip:sample-help", "1");
    expect(renderToStaticMarkup(render(tooltip))).not.toContain('role="tooltip"');
  });
});
