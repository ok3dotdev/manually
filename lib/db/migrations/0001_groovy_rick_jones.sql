ALTER TABLE "resources" ADD COLUMN "source_type" varchar(16) DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "mime_type" varchar(128);--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "page_count" integer;