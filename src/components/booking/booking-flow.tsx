"use client";

import { useState } from "react";
import type { AvailabilityDay } from "@/lib/booking/availability";
import { BookingForm } from "./booking-form";

/** Remounts the form with a fresh state when the customer starts a new request. */
export function BookingFlow({ days }: { days: AvailabilityDay[] }) {
  const [formKey, setFormKey] = useState(0);
  return <BookingForm key={formKey} days={days} onRestart={() => setFormKey((key) => key + 1)} />;
}
