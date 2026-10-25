export type TranslationRequest = {
  text: string;
  /** ISO 639-1 language codes, e.g. "de" → "ar". */
  from: string;
  to: string;
};

export interface Translator {
  /** Stored with the result so we always know where a translation came from. */
  readonly name: string;
  /** Resolves with the translated text or throws a TranslationError. */
  translate(request: TranslationRequest): Promise<string>;
}

/** Translation failure. The message is technical and never contains the text itself. */
export class TranslationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TranslationError";
  }
}
