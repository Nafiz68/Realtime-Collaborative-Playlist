<h1 align="center">Realtime Collaborative Playlist Manager</h1>

![System Overlay](./Screenshot.png)

<h3 align="center"> Live Demo: https://realtime-collaborative-playlist.vercel.app/</h3>

A modern, real-time collaborative playlist application built with Next.js 16, featuring Server-Sent Events (SSE) for live synchronization, drag-and-drop reordering, voting system, and a beautiful glass morphism UI.

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)

## ✨ Features

### Core Features
- **🔄 Real-time Synchronization**: Server-Sent Events (SSE) for instant updates across all connected clients
- **🎭 Drag & Drop Reordering**: Intuitive drag-and-drop interface using @dnd-kit with fractional indexing
- **👍 Voting System**: Upvote/downvote tracks with real-time vote count updates
- **▶️ Now Playing Simulation**: Visual playback with progress bar and auto-advance
- **🔍 Smart Search**: Real-time track search with auto-suggestions and keyboard navigation
- **🎨 Genre Filtering**: Quick filter by music genre
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Bonus Features
- **🔥 Auto-Sort by Votes**: Automatically reorder playlist by popularity with smooth animations
- **⌨️ Keyboard Shortcuts**: Space (play/pause), Arrow keys (prev/next track)
- **📜 Track History**: View recently played tracks
- **💾 Export Playlist**: Download playlist as JSON
- **🎯 Hover Previews**: Spotify-like track details on hover (centered modal with backdrop)
- **🖱️ Click to Play**: Click any track to start playing it immediately
- **⏭️ Seekable Progress Bar**: Click anywhere on the progress bar to jump to that position

### UI Enhancements
- **Modern Glass Morphism** design with gradient backgrounds
- **Smooth Framer Motion** animations throughout
- **Gradient buttons and hover effects**
- **Beautiful color scheme** (purple-blue-pink gradient theme)
- **Auto-suggestions dropdown** with keyboard navigation
- **Status indicators** (connection status, auto-sort, playing state)

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd realtime-playlist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev

# Seed the database with sample data (40 tracks)
npx prisma db seed
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Database Seeding

The application comes with a seed script that populates the database with:
- **40 diverse tracks** across multiple genres (Pop, Rock, Electronic, Classical, Jazz)
- **10 initial playlist items** with varying votes and positions
- Sample data includes artists like Taylor Swift, The Beatles, Daft Punk, Mozart, and Miles Davis

To re-seed the database:
```bash
# Reset database and re-seed
npx prisma migrate reset

# Or just seed without resetting
npx prisma db seed
```

The seed file is located at `prisma/seed.ts` and can be customized to add your own tracks.

## 🏗️ Technical Architecture

### Tech Stack

**Frontend:**
- **Next.js 16.1.4** - React framework with App Router and Turbopack
- **React 19.2.3** - UI library with latest features
- **TypeScript 5.x** - Type safety and better DX
- **Tailwind CSS 4** - Utility-first styling with JIT compilation
- **Framer Motion** - Smooth animations and transitions
- **@dnd-kit** - Accessible drag-and-drop functionality
- **Lucide React** - Beautiful icon library

**Backend:**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.19.2** - Type-safe ORM with SQLite
- **Server-Sent Events** - Real-time one-way communication
- **Zod** - Schema validation

**Testing:**
- **Vitest** - Unit testing framework

### Key Technical Decisions

#### 1. **Server-Sent Events (SSE) over WebSockets**
**Decision:** Use SSE for real-time updates instead of WebSockets.

**Rationale:**
- ✅ Simpler implementation for one-way server→client communication
- ✅ HTTP-based, works through most firewalls and proxies
- ✅ Automatic reconnection built into browser EventSource API
- ✅ Lower overhead for this use case (no need for bidirectional communication)
- ✅ RESTful mutations via HTTP + SSE for updates = clean separation

**Trade-offs:**
- ⚠️ One-way only (client must use separate HTTP requests for mutations)
- ⚠️ No native binary data support (JSON only)

#### 2. **Fractional Indexing for Positions**
**Decision:** Use fractional indexing algorithm for playlist ordering.

**Rationale:**
- ✅ O(1) reordering - no need to update all positions
- ✅ Efficient database updates - only update moved item
- ✅ Supports drag-and-drop between any two items
- ✅ No race conditions with concurrent reorders

**Implementation:** Custom `calculatePosition()` function generates positions between neighbors.

#### 3. **SQLite with Prisma**
**Decision:** Use SQLite as the database with Prisma ORM.

**Rationale:**
- ✅ Zero configuration - file-based database
- ✅ Perfect for development and demo purposes
- ✅ Easy to reset and seed
- ✅ Prisma provides excellent TypeScript integration
- ✅ Simple migration to PostgreSQL/MySQL for production

**Trade-offs:**
- ⚠️ Not suitable for high-concurrency production use
- ⚠️ Limited to single server deployment

#### 4. **Optimistic UI Updates**
**Decision:** Update UI immediately, then sync with server.

**Rationale:**
- ✅ Instant feedback for user actions
- ✅ Better perceived performance
- ✅ SSE ensures eventual consistency across clients

**Trade-offs:**
- ⚠️ Requires error handling for failed mutations
- ⚠️ Potential temporary inconsistency

#### 5. **React Portals for Hover Previews**
**Decision:** Use React portals to render hover previews at document root.

**Rationale:**
- ✅ Escapes stacking context issues
- ✅ Guarantees preview appears above all other UI elements
- ✅ Centered positioning works reliably
- ✅ No z-index conflicts

#### 6. **Keyboard Navigation for Search**
**Decision:** Implement full keyboard support for search suggestions.

**Rationale:**
- ✅ Accessibility (keyboard-only users)
- ✅ Power user efficiency
- ✅ Better UX (Arrow keys, Enter, Escape)

### Project Structure

```
realtime-playlist/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding script
│   └── migrations/           # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application page
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   └── api/              # API routes
│   │       ├── playlist/     # Playlist CRUD operations
│   │       └── tracks/       # Track listing
│   ├── components/
│   │   ├── PlaylistPanel.tsx    # Drag-drop playlist container
│   │   ├── PlaylistItem.tsx     # Individual track in playlist
│   │   ├── TrackLibrary.tsx     # Searchable track library
│   │   └── NowPlayingBar.tsx    # Now playing display
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── sse-manager.ts       # SSE connection manager
│   │   └── calculatePosition.ts # Fractional indexing
│   ├── hooks/
│   │   └── useSSE.ts            # SSE hook with auto-reconnect
│   └── types/
│       └── index.ts             # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## 🎮 Usage Guide

### Basic Operations

1. **Add Tracks**: Search for tracks in the library and click "Add" to add them to the playlist
2. **Reorder**: Drag tracks up or down using the handle icon
3. **Vote**: Use ↑↓ buttons to upvote or downvote tracks
4. **Play**: Click on any track to start playing it
5. **Remove**: Click the ❌ button to remove a track from the playlist
6. **Seek**: Click anywhere on the progress bar to jump to that position

### Keyboard Shortcuts

- **Space**: Play/Pause the current track
- **←**: Previous track
- **→**: Next track
- **↑/↓**: Navigate search suggestions
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions

### Features

- **Auto-Sort**: Toggle the auto-sort button to automatically reorder by votes
- **History**: View recently played tracks (top right button)
- **Export**: Download your playlist as JSON
- **Hover Preview**: Hover over vote buttons to see full track details in a centered modal

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Test files are located alongside their source files (e.g., `calculatePosition.test.ts`).

## 📈 Performance Optimizations

- **Optimistic updates** for instant UI feedback
- **Debounced search** to reduce API calls
- **Memoized calculations** to prevent unnecessary re-renders
- **Virtual scrolling ready** (can be added for large playlists)
- **Efficient SSE** with heartbeat and auto-reconnection
- **Fractional indexing** for O(1) reordering

## 🔒 Security Considerations

- **Input validation** with Zod schemas
- **SQL injection protection** via Prisma ORM
- **XSS prevention** via React's built-in escaping
- **Rate limiting** (recommended for production)
- **Authentication** (not implemented - recommended for production)

## 🚧 Known Limitations

- **Single server**: SSE manager state is in-memory (use Redis for multi-server)
- **No authentication**: All users share the same playlist
- **No persistence of playback state**: Progress resets on page reload
- **SQLite limitations**: Not suitable for high-concurrency production
- **No offline support**: Requires active internet connection

## 💡 If I Had 2 More Days...

### High Priority Features

1. **User Authentication & Multi-Playlist Support**
   - Add user accounts with authentication (NextAuth.js)
   - Personal playlists per user
   - Collaborative playlist invitations
   - Permission system (owner, collaborator, viewer)

2. **Real Audio Playback**
   - Integrate Spotify Web Playback SDK or similar
   - Actual audio streaming
   - Volume controls
   - Crossfade between tracks
   - Shuffle and repeat modes

3. **Advanced Playlist Features**
   - Playlist creation and management
   - Multiple playlists support
   - Duplicate detection
   - Bulk operations (select multiple tracks)
   - Playlist templates/genres

### Technical Improvements

4. **Production-Ready Infrastructure**
   - Migrate to PostgreSQL or MongoDB
   - Redis for SSE state management (multi-server support)
   - Implement rate limiting and request throttling
   - Add proper error boundaries
   - Implement comprehensive logging (Winston/Pino)

5. **Enhanced Real-time Features**
   - WebSocket fallback for SSE
   - Presence system (see who's online)
   - Live cursors (see what others are doing)
   - Conflict resolution for concurrent edits
   - Offline queue with sync on reconnection

6. **Testing & Quality**
   - Increase test coverage to 80%+
   - Add E2E tests with Playwright
   - Integration tests for API routes
   - Performance testing and benchmarking
   - Accessibility audit (WCAG 2.1 AA)

### UX Enhancements

7. **Advanced UI Features**
   - Virtual scrolling for massive playlists (React Window)
   - Advanced search filters (date, duration, BPM)
   - Playlist visualization (waveforms, album art grid)
   - Dark mode toggle
   - Custom themes

8. **Social Features**
   - Comments on tracks
   - User profiles
   - Activity feed
   - Share playlists via link
   - Collaborative notes/descriptions

9. **Analytics & Insights**
   - Listening statistics
   - Most voted tracks
   - User engagement metrics
   - Genre distribution charts
   - Playlist mood analysis

### Mobile & Desktop Apps

10. **Native Applications**
    - React Native mobile apps (iOS/Android)
    - Electron desktop app
    - Push notifications for playlist updates
    - Background playback on mobile
    - Widget support

### Integration & API

11. **Third-Party Integrations**
    - Spotify API integration (import playlists, search)
    - Apple Music integration
    - YouTube Music integration
    - Last.fm scrobbling
    - Discord Rich Presence

12. **Public API**
    - RESTful API documentation (OpenAPI/Swagger)
    - GraphQL endpoint
    - Webhooks for playlist events
    - API rate limiting per user/app
    - SDK for popular languages

### Content & Discovery

13. **Smart Features**
    - AI-powered recommendations
    - Auto-playlist generation based on mood
    - Similar tracks suggestions
    - Genre-based radio
    - Collaborative filtering

14. **Community Features**
    - Public playlist directory
    - Featured playlists
    - Trending tracks
    - User-curated collections
    - Playlist contests/events

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ using Next.js, React, and modern web technologies.

---

**Note**: This is a demonstration project showcasing real-time collaborative features, modern React patterns, and beautiful UI design. For production use, consider implementing authentication, better database solutions, and security hardening.
