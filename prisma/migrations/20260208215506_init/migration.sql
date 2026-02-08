-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "genre" TEXT NOT NULL,
    "cover_url" TEXT,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_playing" BOOLEAN NOT NULL DEFAULT false,
    "played_at" TIMESTAMP(3),

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaylistTrack_position_idx" ON "PlaylistTrack"("position");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_track_id_key" ON "PlaylistTrack"("track_id");

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
