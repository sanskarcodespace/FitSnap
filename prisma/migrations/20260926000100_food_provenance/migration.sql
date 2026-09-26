-- Preserve unknown fiber instead of inventing zero; existing historical values stay unchanged.
ALTER TABLE "FoodItem" ALTER COLUMN "fiberGrams" DROP NOT NULL;
ALTER TABLE "FoodItem" ALTER COLUMN "fiberGrams" DROP DEFAULT;
ALTER TABLE "FoodItem"
  ADD COLUMN "nutritionSource" TEXT,
  ADD COLUMN "sourceFoodId" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "portionAmount" DOUBLE PRECISION,
  ADD COLUMN "portionUnit" TEXT;
