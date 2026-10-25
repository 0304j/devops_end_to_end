import "server-only";
import { DeepLTranslator } from "./deepl";
import { MockTranslator } from "./mock";
import type { Translator } from "./types";

export type { Translator } from "./types";

/**
 * Returns the translator selected by TRANSLATION_PROVIDER, or null when
 * translation is disabled ("none" or unset).
 *
 *   TRANSLATION_PROVIDER=mock    development marker, no real translation
 *   TRANSLATION_PROVIDER=deepl   needs DEEPL_API_KEY
 *   TRANSLATION_PROVIDER=none    notifications contain the German original
 */
export function getTranslator(): Translator | null {
  const provider = process.env.TRANSLATION_PROVIDER ?? "none";
  switch (provider) {
    case "none":
      return null;
    case "mock":
      return new MockTranslator();
    case "deepl": {
      const apiKey = process.env.DEEPL_API_KEY;
      if (!apiKey) throw new Error("TRANSLATION_PROVIDER=deepl requires DEEPL_API_KEY");
      return new DeepLTranslator(apiKey);
    }
    default:
      throw new Error(`Unknown TRANSLATION_PROVIDER "${provider}"`);
  }
}
