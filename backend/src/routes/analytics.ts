import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory analytics store
interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
}

const analyticsEvents: AnalyticsEvent[] = [];

// Aggregate metrics
const metrics = {
  triageStarted: 0,
  triageCompleted: 0,
  triageAbandoned: 0,
  emergencyDetected: 0,
  videoCallsStarted: 0,
  videoCallsCompleted: 0,
  avgTriageDurationMs: 0,
  totalTriageDurationMs: 0,
  aiAssistQueries: 0,
  registrations: 0,
};

/**
 * POST /api/analytics/track
 * Track an analytics event
 */
router.post('/track', (req: Request, res: Response) => {
  try {
    const { event, properties, sessionId, userId } = req.body;

    if (!event) {
      return res.status(400).json({ message: 'Event name is required' });
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: properties || {},
      timestamp: new Date().toISOString(),
      sessionId,
      userId,
    };

    analyticsEvents.push(analyticsEvent);

    // Update aggregate metrics
    switch (event) {
      case 'triage_started':
        metrics.triageStarted++;
        break;
      case 'triage_completed':
        metrics.triageCompleted++;
        if (properties?.durationMs) {
          metrics.totalTriageDurationMs += properties.durationMs;
          metrics.avgTriageDurationMs = Math.round(
            metrics.totalTriageDurationMs / metrics.triageCompleted
          );
        }
        break;
      case 'triage_abandoned':
        metrics.triageAbandoned++;
        break;
      case 'emergency_detected':
        metrics.emergencyDetected++;
        break;
      case 'video_call_started':
        metrics.videoCallsStarted++;
        break;
      case 'video_call_ended':
        metrics.videoCallsCompleted++;
        break;
      case 'ai_assist_query':
        metrics.aiAssistQueries++;
        break;
      case 'user_registered':
        metrics.registrations++;
        break;
    }

    console.log(`📊 Analytics: ${event}`, properties || '');

    res.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: 'Failed to track event', error: error.message });
  }
});

/**
 * GET /api/analytics/metrics
 * Get aggregate metrics dashboard
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const completionRate = metrics.triageStarted > 0
      ? Math.round((metrics.triageCompleted / metrics.triageStarted) * 100)
      : 0;

    res.json({
      ...metrics,
      triageCompletionRate: `${completionRate}%`,
      totalEvents: analyticsEvents.length,
      avgTriageDuration: metrics.avgTriageDurationMs > 0
        ? `${Math.round(metrics.avgTriageDurationMs / 1000)}s`
        : 'N/A',
    });
  } catch (error: any) {
    console.error('Analytics metrics error:', error);
    res.status(500).json({ message: 'Failed to retrieve metrics', error: error.message });
  }
});

/**
 * GET /api/analytics/events
 * Get recent analytics events (last 100)
 */
router.get('/events', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const recentEvents = analyticsEvents.slice(-limit).reverse();

    res.json({
      total: analyticsEvents.length,
      showing: recentEvents.length,
      events: recentEvents,
    });
  } catch (error: any) {
    console.error('Analytics events error:', error);
    res.status(500).json({ message: 'Failed to retrieve events', error: error.message });
  }
});

export default router;
