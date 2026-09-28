-- Existing rows predate accounts and have no owner, so they are removed
-- rather than assigned to anyone.
DELETE FROM "embeddings";--> statement-breakpoint
DELETE FROM "resources";--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "user_id" varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "user_id" varchar(191) NOT NULL;--> statement-breakpoint
CREATE INDEX "embeddings_user_id_idx" ON "embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resources_user_id_idx" ON "resources" USING btree ("user_id");