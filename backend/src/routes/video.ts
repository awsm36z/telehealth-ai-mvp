import express, { Request, Response } from 'express';
import axios from 'axios';
import { activeCalls, patientProfiles } from '../storage';

const router = express.Router();

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY || '';
const DAILY_API_URL = 'https://api.daily.co/v1';

console.log('🎥 Daily.co API Key loaded:', DAILY_API_KEY ? `${DAILY_API_KEY.substring(0, 20)}...` : 'NOT FOUND');

/**
 * POST /api/video/create-room
 * Create a video call room for patient-doctor consultation
 */
router.post('/create-room', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, sessionId, patientName } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Ensure a minimal patient profile exists so the doctor queue can display this patient.
    if (!patientProfiles[patientId]) {
      patientProfiles[patientId] = {
        id: patientId,
        name: patientName || `Patient ${patientId}`,
        email: '',
        createdAt: new Date().toISOString(),
      };
      console.log(`📝 Created minimal profile for patient ${patientId} during room creation`);
    } else if (patientName && patientProfiles[patientId].name !== patientName) {
      patientProfiles[patientId].name = patientName;
    }

    // Reuse existing waiting/active room for this patient to avoid room divergence.
    const existingCall = Object.values(activeCalls).find(
      (call: any) =>
        String(call.patientId) === String(patientId) &&
        (call.status === 'waiting' || call.status === 'active')
    ) as any;

    if (existingCall) {
      return res.json({
        roomName: existingCall.roomName,
        roomUrl: existingCall.roomUrl,
        message: 'Reusing existing video room',
      });
    }

    // Create unique room name
    const roomName = `consultation-${patientId}-${Date.now()}`;

    // Create room via Daily.co API
    const response = await axios.post(
      `${DAILY_API_URL}/rooms`,
      {
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2, // Only patient and doctor
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: 'cloud', // Optional: enable cloud recording
          exp: Math.floor(Date.now() / 1000) + 3600, // Room expires in 1 hour
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
      }
    );

    const room = response.data;

    // Store call information
    activeCalls[room.name] = {
      roomName: room.name,
      roomUrl: room.url,
      patientId,
      doctorId: doctorId || null,
      sessionId: sessionId || null,
      createdAt: new Date().toISOString(),
      patientJoined: false,
      doctorJoined: false,
      status: 'waiting', // waiting, active, completed
    };

    console.log(`✅ Created video room: ${room.name}`);

    res.json({
      roomName: room.name,
      roomUrl: room.url,
      message: 'Video room created successfully',
    });
  } catch (error: any) {
    console.error('Create room error:', error.response?.data || error.message);

    // If no API key, return mock room for development
    if (!DAILY_API_KEY) {
      const mockRoomName = `consultation-${req.body.patientId}-${Date.now()}`;
      activeCalls[mockRoomName] = {
        roomName: mockRoomName,
        roomUrl: `https://telehealth.daily.co/${mockRoomName}`,
        patientId: req.body.patientId,
        doctorId: req.body.doctorId || null,
        sessionId: req.body.sessionId || null,
        createdAt: new Date().toISOString(),
        patientJoined: false,
        doctorJoined: false,
        status: 'waiting',
      };

      return res.json({
        roomName: mockRoomName,
        roomUrl: `https://telehealth.daily.co/${mockRoomName}`,
        message: 'Mock video room created (no Daily.co API key)',
      });
    }

    res.status(500).json({
      message: 'Failed to create video room',
      error: error.message,
    });
  }
});

/**
 * POST /api/video/join-room
 * Get a token to join an existing video room
 */
router.post('/join-room', async (req: Request, res: Response) => {
  try {
    const { roomName, userId, userName, userType } = req.body;

    if (!roomName || !userId || !userType) {
      return res.status(400).json({
        message: 'Room name, user ID, and user type are required'
      });
    }

    // Check if room exists in our storage
    const callInfo = activeCalls[roomName];
    if (!callInfo) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Update participant presence and derive status.
    if (userType === 'doctor') {
      callInfo.doctorId = userId;
      callInfo.doctorJoined = true;
      callInfo.status = 'active';
      if (!callInfo.startedAt) {
        callInfo.startedAt = new Date().toISOString();
      }
    }
    if (userType === 'patient') {
      callInfo.patientJoined = true;
      callInfo.status = callInfo.doctorJoined ? 'active' : 'waiting';
    }

    // Create meeting token via Daily.co API
    try {
      const tokenResponse = await axios.post(
        `${DAILY_API_URL}/meeting-tokens`,
        {
          properties: {
            room_name: roomName,
            user_name: userName || `${userType}-${userId}`,
            is_owner: userType === 'doctor', // Doctor has owner privileges
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
        }
      );

      const token = tokenResponse.data.token;

      console.log(`✅ Generated token for ${userType} ${userId} to join ${roomName}`);

      res.json({
        token,
        roomUrl: callInfo.roomUrl,
        message: 'Token generated successfully',
      });
    } catch (apiError: any) {
      // If no API key or API error, return mock token
      if (!DAILY_API_KEY) {
        console.log(`⚠️  No Daily.co API key, returning mock token for ${userType}`);
        return res.json({
          token: `mock-token-${userId}-${Date.now()}`,
          roomUrl: callInfo.roomUrl,
          message: 'Mock token generated (no Daily.co API key)',
        });
      }

      if (apiError.response?.status === 401) {
        return res.status(500).json({
          message: 'Daily API authentication failed. Check DAILY_API_KEY.',
        });
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error('Join room error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to join room',
      error: error.message,
    });
  }
});

/**
 * GET /api/video/active-calls
 * Get list of active video calls (for doctor queue)
 */
router.get('/active-calls', async (req: Request, res: Response) => {
  try {
    const calls = Object.values(activeCalls)
      .filter(call => call.status === 'waiting' || call.status === 'active')
      .map(call => ({
        roomName: call.roomName,
        patientId: call.patientId,
        doctorId: call.doctorId,
        status: call.status,
        patientJoined: !!call.patientJoined,
        doctorJoined: !!call.doctorJoined,
        createdAt: call.createdAt,
        startedAt: call.startedAt,
      }));

    res.json(calls);
  } catch (error: any) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      message: 'Failed to retrieve active calls',
      error: error.message,
    });
  }
});

/**
 * POST /api/video/end-call
 * End a video call and update status
 */
router.post('/end-call', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const callInfo = activeCalls[roomName];
    if (!callInfo) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Update call status
    callInfo.status = 'completed';
    callInfo.endedAt = new Date().toISOString();

    console.log(`✅ Ended call: ${roomName}`);

    res.json({
      message: 'Call ended successfully',
      callInfo,
    });
  } catch (error: any) {
    console.error('End call error:', error);
    res.status(500).json({
      message: 'Failed to end call',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/video/room/:roomName
 * Delete a video room (cleanup after call)
 */
router.delete('/room/:roomName', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;

    // Delete from Daily.co
    if (DAILY_API_KEY) {
      try {
        await axios.delete(`${DAILY_API_URL}/rooms/${roomName}`, {
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
        });
        console.log(`✅ Deleted Daily.co room: ${roomName}`);
      } catch (apiError: any) {
        console.warn(`⚠️  Could not delete Daily.co room: ${apiError.message}`);
      }
    }

    // Remove from our storage
    delete activeCalls[roomName];

    res.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error('Delete room error:', error);
    res.status(500).json({
      message: 'Failed to delete room',
      error: error.message,
    });
  }
});

export default router;
