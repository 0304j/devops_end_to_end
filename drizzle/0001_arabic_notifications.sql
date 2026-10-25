CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."translation_status" AS ENUM('pending', 'translated', 'failed', 'skipped');--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "translation_status" "translation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "translation_provider" text;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "notification_status" "notification_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "notification_attempts" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "notification_error" text;