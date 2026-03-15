import { getConfig } from '../config';

export interface PostizPost {
  id?: string;
  platform: string;
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
}

export interface PostizScheduleResponse {
  id: string;
  status: string;
  scheduled_at: string;
}

export async function schedulePost(
  tenantId: string,
  post: PostizPost
): Promise<PostizScheduleResponse> {
  const config = getConfig();
  const response = await fetch(`${config.POSTIZ_API_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.POSTIZ_API_KEY}`,
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Postiz error ${response.status}: ${err.slice(0, 200)}`);
  }
  return response.json() as Promise<PostizScheduleResponse>;
}

export async function getPostStatus(
  tenantId: string,
  postizPostId: string
): Promise<{ status: string; published_at?: string }> {
  const config = getConfig();
  const response = await fetch(`${config.POSTIZ_API_URL}/api/posts/${postizPostId}`, {
    headers: {
      Authorization: `Bearer ${config.POSTIZ_API_KEY}`,
      'x-tenant-id': tenantId,
    },
  });
  if (!response.ok) throw new Error(`Postiz status error: ${response.status}`);
  return response.json() as Promise<{ status: string; published_at?: string }>;
}

export async function deletePost(tenantId: string, postizPostId: string): Promise<void> {
  const config = getConfig();
  const response = await fetch(`${config.POSTIZ_API_URL}/api/posts/${postizPostId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.POSTIZ_API_KEY}`,
      'x-tenant-id': tenantId,
    },
  });
  if (!response.ok) throw new Error(`Postiz delete error: ${response.status}`);
}
