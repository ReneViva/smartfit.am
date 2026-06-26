ALTER TABLE "PublicContent"
ADD COLUMN "ctaUrl" TEXT,
ADD COLUMN "ctaLabel" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "visibleOnApp" BOOLEAN NOT NULL DEFAULT false;

WITH ordered_content AS (
  SELECT
    "id",
    ((ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) - 1) * 10)::INTEGER AS "nextSortOrder"
  FROM "PublicContent"
)
UPDATE "PublicContent"
SET "sortOrder" = ordered_content."nextSortOrder"
FROM ordered_content
WHERE "PublicContent"."id" = ordered_content."id";

CREATE INDEX "PublicContent_sortOrder_idx" ON "PublicContent"("sortOrder");
