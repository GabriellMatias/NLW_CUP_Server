/*
  Warnings:

  - A unique constraint covering the columns `[participantsId,gameId]` on the table `Guess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Guess_participantsId_gameId_key" ON "Guess"("participantsId", "gameId");
