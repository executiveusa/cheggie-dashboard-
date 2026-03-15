import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { IngestYoutubeSchema } from '@cheggie/shared';
import {
  ingestYoutubeVideo,
  listTranscripts,
  getTranscript,
} from '../services/youtubeService';

const router = Router();
router.use(authMiddleware, requireTenant);

router.get('/transcripts', async (req: Request, res: Response) => {
  try {
    const transcripts = await listTranscripts(req.tenantId!);
    res.json({ data: transcripts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list transcripts' });
  }
});

router.post('/ingest', async (req: Request, res: Response) => {
  const parsed = IngestYoutubeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    return;
  }
  try {
    const result = await ingestYoutubeVideo(
      req.tenantId!,
      parsed.data.video_url,
      parsed.data.generate_summary
    );
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to ingest video' });
  }
});

router.get('/transcripts/:id', async (req: Request, res: Response) => {
  try {
    const transcript = await getTranscript(req.tenantId!, req.params['id']!);
    res.json({ data: transcript });
  } catch {
    res.status(404).json({ error: 'Transcript not found' });
  }
});

export default router;
