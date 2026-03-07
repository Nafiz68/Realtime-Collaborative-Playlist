-- CreateTable (IF NOT EXISTS to handle re-runs safely)
CREATE TABLE IF NOT EXISTS "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Track" (
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
CREATE TABLE IF NOT EXISTS "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_playing" BOOLEAN NOT NULL DEFAULT false,
    "played_at" TIMESTAMP(3),

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaylistTrack_position_idx" ON "PlaylistTrack"("position");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaylistTrack_room_id_idx" ON "PlaylistTrack"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlaylistTrack_track_id_room_id_key" ON "PlaylistTrack"("track_id", "room_id");

-- AddForeignKey (DO nothing if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlaylistTrack_track_id_fkey'
  ) THEN
    ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_track_id_fkey"
      FOREIGN KEY ("track_id") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlaylistTrack_room_id_fkey'
  ) THEN
    ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_room_id_fkey"
      FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
