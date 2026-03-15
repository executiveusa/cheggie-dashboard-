import { getSupabaseAdmin } from './supabase';
import { extractVideoId } from '@cheggie/agents';

export async function ingestYoutubeVideo(
  tenantId: string,
  videoUrl: string,
  _generateSummary: boolean
): Promise<{ transcript_id: string }> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error('Invalid YouTube URL');
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from('youtube_transcripts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('video_id', videoId)
    .single();
  if (existing) return { transcript_id: existing.id };
  // In production this calls a transcript API; here we create the record and
  // the jobs worker will process it asynchronously.
  const { data, error } = await admin
    .from('youtube_transcripts')
    .insert({ tenant_id: tenantId, video_id: videoId, transcript: '', processed: false })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create transcript record: ${error.message}`);
  return { transcript_id: data.id };
}

export async function listTranscripts(tenantId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('youtube_transcripts')
    .select('id, video_id, title, channel, summary, tags, processed, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list transcripts: ${error.message}`);
  return data ?? [];
}

export async function getTranscript(tenantId: string, transcriptId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('youtube_transcripts')
    .select('*')
    .eq('id', transcriptId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !data) throw new Error('Transcript not found');
  return data;
}
