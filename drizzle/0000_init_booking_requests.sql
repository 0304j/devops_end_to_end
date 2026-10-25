CREATE TYPE "public"."booking_status" AS ENUM('requested', 'confirmed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"service_id" text NOT NULL,
	"slot_start" timestamp with time zone NOT NULL,
	"vehicle_make" text NOT NULL,
	"vehicle_model" text NOT NULL,
	"vehicle_year" smallint,
	"license_plate" text,
	"description" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_requests_description_length" CHECK (char_length("booking_requests"."description") between 10 and 2000),
	CONSTRAINT "booking_requests_vehicle_year_range" CHECK ("booking_requests"."vehicle_year" is null or "booking_requests"."vehicle_year" between 1950 and 2100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "booking_requests_active_slot_uq" ON "booking_requests" USING btree ("slot_start") WHERE "booking_requests"."status" in ('requested', 'confirmed');--> statement-breakpoint
CREATE INDEX "booking_requests_created_at_idx" ON "booking_requests" USING btree ("created_at");