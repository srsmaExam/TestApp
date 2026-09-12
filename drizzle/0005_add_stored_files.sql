CREATE TABLE IF NOT EXISTS "stored_files" (
	"key" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
