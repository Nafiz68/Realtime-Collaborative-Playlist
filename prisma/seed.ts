import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Popular search terms to get diverse tracks
const searchTerms = [
  'rock', 'pop', 'jazz', 'electronic', 'classical',
  'hip hop', 'indie', 'alternative', 'r&b', 'soul'
];

async function fetchTracksFromItunes(term: string, limit: number = 10) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching tracks for term "${term}":`, error);
    return [];
  }
}

async function main() {
  console.log('Fetching real tracks from iTunes API...');
  
  let allTracks: any[] = [];
  
  // Fetch tracks for each genre
  for (const term of searchTerms) {
    const tracks = await fetchTracksFromItunes(term, 4);
    allTracks = allTracks.concat(tracks);
    console.log(`Fetched ${tracks.length} tracks for "${term}"`);
  }

  console.log(`Total tracks fetched: ${allTracks.length}`);

  // Insert tracks into database
  let insertedCount = 0;
  for (const track of allTracks) {
    try {
      await prisma.track.upsert({
        where: { id: String(track.trackId) },
        update: {},
        create: {
          id: String(track.trackId),
          title: track.trackName || 'Unknown Title',
          artist: track.artistName || 'Unknown Artist',
          album: track.collectionName || 'Unknown Album',
          duration_seconds: Math.floor((track.trackTimeMillis || 180000) / 1000),
          genre: track.primaryGenreName || 'Unknown',
          cover_url: track.artworkUrl100 || null,
          preview_url: track.previewUrl || null,
        },
      });
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting track ${track.trackId}:`, error);
    }
  }

  console.log(`Seed completed: ${insertedCount} real tracks created.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
