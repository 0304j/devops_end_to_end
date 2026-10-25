import { TranslationError, type TranslationRequest, type Translator } from "./types";

const TIMEOUT_MS = 10_000;

/**
 * DeepL API (https://developers.deepl.com/docs/api-reference/translate).
 * Free-plan keys end in ":fx" and use a different host.
 */
export class DeepLTranslator implements Translator {
  readonly name = "deepl";
  private readonly endpoint: string;

  constructor(private readonly apiKey: string) {
    const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    this.endpoint = `https://${host}/v2/translate`;
  }

  async translate({ text, from, to }: TranslationRequest): Promise<string> {
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [text],
          source_lang: from.toUpperCase(),
          target_lang: to.toUpperCase(),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new TranslationError("DeepL request failed (network or timeout)", { cause: error });
    }

    if (!response.ok) {
      throw new TranslationError(`DeepL responded with HTTP ${response.status}`);
    }

    const body = (await response.json()) as { translations?: { text?: unknown }[] };
    const translated = body.translations?.[0]?.text;
    if (typeof translated !== "string" || translated.trim() === "") {
      throw new TranslationError("DeepL returned no translation");
    }
    return translated;
  }
}
