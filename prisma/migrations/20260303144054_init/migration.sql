-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER,
    "name" TEXT NOT NULL,
    "platform" TEXT,
    "year" INTEGER,
    "genre" TEXT,
    "publisher" TEXT,
    "naSales" DOUBLE PRECISION DEFAULT 0,
    "euSales" DOUBLE PRECISION DEFAULT 0,
    "jpSales" DOUBLE PRECISION DEFAULT 0,
    "otherSales" DOUBLE PRECISION DEFAULT 0,
    "globalSales" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Game_platform_idx" ON "Game"("platform");

-- CreateIndex
CREATE INDEX "Game_genre_idx" ON "Game"("genre");

-- CreateIndex
CREATE INDEX "Game_publisher_idx" ON "Game"("publisher");

-- CreateIndex
CREATE INDEX "Game_year_idx" ON "Game"("year");

-- CreateIndex
CREATE INDEX "Game_globalSales_idx" ON "Game"("globalSales");
