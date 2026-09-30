import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebcastPushConnection } from 'tiktok-live-connector';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Firebase initialization
const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (firebaseConfig) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
  });
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is missing in environment variables.");
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for the dashboard
  }
});

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || '@karam.drame';

let isLive = false;
let sessionData = null;
let tiktokConnection = null;
let timelineInterval = null;

const initSession = () => {
  return {
    sessionId: `live_${new Date().toISOString().replace(/[:.-]/g, '_')}`,
    startedAt: Date.now(),
    viewersCount: 0,
    peakViewers: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    initialFollowers: 0,
    finalFollowers: 0,
    timeline: [],
  };
};

const formatUptime = (startedAt) => {
  const diff = Math.floor((Date.now() - startedAt) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const connectTikTok = async () => {
  if (tiktokConnection) {
    tiktokConnection.disconnect();
  }

  tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME);

  tiktokConnection.connect().then(state => {
    console.info(`✅ Connected to roomId ${state.roomId}`);
    isLive = true;
    sessionData = initSession();
    
    // Attempt to get initial followers from room info
    if (state.roomInfo?.owner?.follower_count) {
      sessionData.initialFollowers = state.roomInfo.owner.follower_count;
    }

    io.emit('liveStatus', { isLive: true, sessionId: sessionData.sessionId, startedAt: sessionData.startedAt, timeline: sessionData.timeline });

    // Timeline recording every minute
    if (timelineInterval) clearInterval(timelineInterval);
    timelineInterval = setInterval(() => {
      if (isLive && sessionData) {
        const minutes = Math.floor((Date.now() - sessionData.startedAt) / 60000);
        const point = { time: minutes, viewers: sessionData.viewersCount };
        sessionData.timeline.push(point);
        io.emit('timelinePoint', point);
      }
    }, 60000);

  }).catch(err => {
    console.error('❌ Failed to connect:', err);
    setTimeout(connectTikTok, 10000); // Retry after 10 seconds
  });

  tiktokConnection.on('roomUser', data => {
    if (!sessionData) return;
    sessionData.viewersCount = data.viewerCount;
    if (data.viewerCount > sessionData.peakViewers) {
      sessionData.peakViewers = data.viewerCount;
    }
    emitMetrics();
  });

  tiktokConnection.on('like', data => {
    if (!sessionData) return;
    sessionData.totalLikes += data.likeCount;
    emitMetrics();
  });

  tiktokConnection.on('chat', data => {
    if (!sessionData) return;
    sessionData.totalComments += 1;
    io.emit('chatMessage', data);
    emitMetrics();
  });

  tiktokConnection.on('social', data => {
    if (!sessionData) return;
    if (data.label && data.label.includes('shared')) {
      sessionData.totalShares += 1;
    } else {
      // It's likely a follow
    }
    emitMetrics();
  });

  tiktokConnection.on('streamEnd', async (actionId) => {
    console.warn('🛑 Stream Ended');
    if (sessionData) {
      // Try to get final followers
      try {
        const roomInfo = await tiktokConnection.getRoomInfo();
        if (roomInfo?.owner?.follower_count) {
          sessionData.finalFollowers = roomInfo.owner.follower_count;
        }
      } catch (e) {
        console.error("Could not fetch final room info");
      }

      const durationStr = formatUptime(sessionData.startedAt);
      const newFollowers = Math.max(0, sessionData.finalFollowers - sessionData.initialFollowers);
      
      const finalArchive = {
        ...sessionData,
        durationStr,
        newFollowers,
        endedAt: Date.now()
      };

      // Save to Firebase
      if (db) {
        try {
          await db.collection('tiktok_archives').doc(sessionData.sessionId).set(finalArchive);
          console.log(`💾 Saved archive ${sessionData.sessionId} to Firestore.`);
        } catch (error) {
          console.error("Error saving archive to Firestore:", error);
        }
      }

      io.emit('streamEnded', { session: finalArchive });
    }
    
    isLive = false;
    sessionData = null;
    if (timelineInterval) clearInterval(timelineInterval);
    
    // Auto-reconnect to wait for next stream
    setTimeout(connectTikTok, 30000);
  });

  tiktokConnection.on('error', err => {
    console.error('TikTok Live Error:', err);
  });
};

const emitMetrics = () => {
  if (!isLive || !sessionData) return;
  io.emit('metricsUpdate', {
    viewersCount: sessionData.viewersCount,
    peakViewers: sessionData.peakViewers,
    totalLikes: sessionData.totalLikes,
    totalComments: sessionData.totalComments,
    totalShares: sessionData.totalShares,
    newFollowers: sessionData.finalFollowers ? Math.max(0, sessionData.finalFollowers - sessionData.initialFollowers) : 0,
    uptimeFormatted: formatUptime(sessionData.startedAt)
  });
};

io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);
  socket.on('requestState', () => {
    if (isLive && sessionData) {
      socket.emit('liveStatus', { isLive: true, sessionId: sessionData.sessionId, startedAt: sessionData.startedAt, timeline: sessionData.timeline });
      emitMetrics();
    } else {
      socket.emit('liveStatus', { isLive: false });
    }
  });
});

app.get('/', (req, res) => {
  res.send('Lumina Analytics TikTok Live Backend is running.');
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  connectTikTok();
});
