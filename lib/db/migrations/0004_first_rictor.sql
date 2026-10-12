ALTER TABLE "embeddings" ADD COLUMN "citation" varchar(64);--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "section" varchar(16);--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "subsection" varchar(16);--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "heading" text;