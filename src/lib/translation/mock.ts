import type { TranslationRequest, Translator } from "./types";

/**
 * DEVELOPMENT ONLY. Does not translate: it returns the original text with a
 * clear marker ("[ترجمة تجريبية]" = "test translation") so a mock result can
 * never be mistaken for a real translation.
 *
 * Set MOCK_TRANSLATION_FAIL=true to simulate a provider failure.
 */
export class MockTranslator implements Translator {
  readonly name = "mock";

  async translate({ text }: TranslationRequest): Promise<string> {
    if (process.env.MOCK_TRANSLATION_FAIL === "true") {
      throw new Error("Mock translation failure (MOCK_TRANSLATION_FAIL=true)");
    }
    return `[ترجمة تجريبية – ليست ترجمة حقيقية]\n${text}`;
  }
}
