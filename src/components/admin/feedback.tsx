"use client";

import { createContext, type ReactNode, use, useState } from "react";
import type { ActionState } from "@/app/admin/actions";

type Feedback = Exclude<ActionState, { status: "idle" }>;

const FeedbackContext = createContext<(feedback: Feedback) => void>(() => {});

/**
 * Shows the result of the last admin action in one place. Needed because a
 * card can disappear from the list after an action (e.g. a confirmed request
 * leaves the "Offen" filter), taking any message inside it along.
 */
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  return (
    <FeedbackContext value={setFeedback}>
      <div role="status" aria-live="polite" className="sticky top-0 z-10 empty:hidden">
        {feedback ? (
          <p
            className={`mb-4 border-l-4 bg-field px-4 py-3 font-medium shadow-sm ${
              feedback.status === "error" ? "border-danger text-danger" : "border-ink text-ink"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
      {children}
    </FeedbackContext>
  );
}

/** Wraps a Server Action so its result is reported in the shared status bar. */
export function useReportedAction(
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>,
) {
  const report = use(FeedbackContext);
  return async (previous: ActionState, formData: FormData) => {
    const result = await action(previous, formData);
    if (result.status !== "idle") report(result);
    return result;
  };
}
