import { beforeEach, expect, it, vi } from "vitest";
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
import { readFile } from "node:fs/promises";
import { GET } from "./route";

beforeEach(() => vi.resetAllMocks());
const request = new Request("https://renttools.io/uploads/blog/example.webp");
const get = (filename: string) => GET(request, { params: Promise.resolve({ filename }) });

it("serves a file created after application startup", async () => {
  vi.mocked(readFile).mockResolvedValue(Buffer.from("new image"));
  const response = await get("a".repeat(32) + ".webp");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/webp");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(await response.text()).toBe("new image");
});

it.each(["../private.webp", "a.webp", "a".repeat(32) + ".svg", "A".repeat(32) + ".webp"])("refuses unexpected filenames: %s", async (filename) => {
  expect((await get(filename)).status).toBe(404);
  expect(readFile).not.toHaveBeenCalled();
});

it("returns 404 for missing uploads without caching the miss", async () => {
  vi.mocked(readFile).mockRejectedValue(Object.assign(new Error(), { code: "ENOENT" }));
  const response = await get("b".repeat(32) + ".webp");
  expect(response.status).toBe(404);
  expect(response.headers.get("cache-control")).toBeNull();
});
