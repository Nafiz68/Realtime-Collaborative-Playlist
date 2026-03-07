/*
  Warnings:

  - Added the required column `room_id` to the `PlaylistTrack` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlaylistTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "added_by" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_playing" BOOLEAN NOT NULL DEFAULT false,
    "played_at" DATETIME,
    CONSTRAINT "PlaylistTrack_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlaylistTrack_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PlaylistTrack" ("added_at", "added_by", "id", "is_playing", "played_at", "position", "track_id", "votes") SELECT "added_at", "added_by", "id", "is_playing", "played_at", "position", "track_id", "votes" FROM "PlaylistTrack";
DROP TABLE "PlaylistTrack";
ALTER TABLE "new_PlaylistTrack" RENAME TO "PlaylistTrack";
CREATE INDEX "PlaylistTrack_position_idx" ON "PlaylistTrack"("position");
CREATE INDEX "PlaylistTrack_room_id_idx" ON "PlaylistTrack"("room_id");
CREATE UNIQUE INDEX "PlaylistTrack_track_id_room_id_key" ON "PlaylistTrack"("track_id", "room_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");
