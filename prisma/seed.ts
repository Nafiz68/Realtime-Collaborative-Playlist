import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const genres = ['Rock', 'Pop', 'Electronic', 'Jazz', 'Classical'];
const artists = ['Alice', 'Bob', 'Anonymous', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan'];
const albums = ['Album 1', 'Album 2', 'Album 3', 'Album 4', 'Album 5', 'Album 6', 'Album 7', 'Album 8', 'Album 9', 'Album 10'];

async function main() {
  // Seed 40 tracks (library is global, not room-specific)
  for (let i = 1; i <= 40; i++) {
    await prisma.track.upsert({
      where: { id: `track-${i}` },
      update: {},
      create: {
        id: `track-${i}`,
        title: `Track Title ${i}`,
        artist: artists[i % artists.length],
        album: albums[i % albums.length],
        duration_seconds: 120 + ((i * 7) % 301),
        genre: genres[i % genres.length],
        cover_url: null,
      },
    });
  }

  console.log('Seed completed: 40 tracks created.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
