import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepLTranslator } from "./deepl";
import { TranslationError } from "./types";

const request = { text: "Bremsen quietschen", from: "de", to: "ar" };

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("DeepLTranslator", () => {
  it("calls the free API for :fx keys and returns the translation", async () => {
    const fetchMock = mockFetch(Response.json({ translations: [{ text: "صرير الفرامل" }] }));
    const result = await new DeepLTranslator("key:fx").translate(request);

    expect(result).toBe("صرير الفرامل");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(init.headers).toMatchObject({ Authorization: "DeepL-Auth-Key key:fx" });
    expect(JSON.parse(init.body as string)).toEqual({
      text: ["Bremsen quietschen"],
      source_lang: "DE",
      target_lang: "AR",
    });
  });

  it("uses the paid API host for other keys", async () => {
    const fetchMock = mockFetch(Response.json({ translations: [{ text: "x" }] }));
    await new DeepLTranslator("paid-key").translate(request);
    expect(fetchMock.mock.calls[0]).toContain("https://api.deepl.com/v2/translate");
  });

  it.each([
    ["an HTTP error", new Response("forbidden", { status: 403 }), "HTTP 403"],
    ["an empty result", Response.json({ translations: [] }), "no translation"],
    ["a network error", new TypeError("fetch failed"), "network or timeout"],
  ])("throws a TranslationError on %s", async (_label, response, message) => {
    mockFetch(response);
    const promise = new DeepLTranslator("key:fx").translate(request);
    await expect(promise).rejects.toBeInstanceOf(TranslationError);
    await expect(promise).rejects.toThrow(message);
  });

  it("does not put the API key or the text into error messages", async () => {
    mockFetch(new Response("", { status: 500 }));
    const error = await new DeepLTranslator("secret-key:fx").translate(request).catch((e) => e);
    expect(String(error.message)).not.toContain("secret-key");
    expect(String(error.message)).not.toContain("Bremsen");
  });
});
