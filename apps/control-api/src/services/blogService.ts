import { getSupabaseAdmin } from './supabase';
import { logAudit } from './auditService';
import { generateSlug } from '@cheggie/agents';

export async function createBlogPost(
  tenantId: string,
  userId: string,
  data: {
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    seo_meta?: Record<string, unknown>;
  }
) {
  const admin = getSupabaseAdmin();
  const slug = data.slug ?? generateSlug(data.title);
  const { data: post, error } = await admin
    .from('blog_posts')
    .insert({
      tenant_id: tenantId,
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt ?? null,
      tags: data.tags ?? [],
      seo_meta: data.seo_meta ?? {},
      author_id: userId,
    })
    .select('*')
    .single();
  if (error) throw new Error(`Failed to create blog post: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'blog.post.created',
    resource_type: 'blog_post',
    resource_id: post.id,
    new_value: { title: post.title, slug: post.slug },
  });
  return post;
}

export async function listBlogPosts(tenantId: string, status?: string) {
  const admin = getSupabaseAdmin();
  let query = admin
    .from('blog_posts')
    .select('id, title, slug, excerpt, status, tags, author_id, published_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list blog posts: ${error.message}`);
  return data ?? [];
}

export async function getBlogPost(tenantId: string, postId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .eq('tenant_id', tenantId)
    .single();
  if (error || !data) throw new Error('Blog post not found');
  return data;
}

export async function updateBlogPost(
  tenantId: string,
  postId: string,
  userId: string,
  updates: Partial<{
    title: string;
    content: string;
    excerpt: string;
    status: string;
    tags: string[];
    seo_meta: Record<string, unknown>;
  }>
) {
  const admin = getSupabaseAdmin();
  const existing = await getBlogPost(tenantId, postId);
  const extra: Record<string, unknown> = {};
  if (updates.status === 'published' && existing.status !== 'published') {
    extra.published_at = new Date().toISOString();
  }
  const { data, error } = await admin
    .from('blog_posts')
    .update({ ...updates, ...extra, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error) throw new Error(`Failed to update blog post: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'blog.post.updated',
    resource_type: 'blog_post',
    resource_id: postId,
    old_value: { status: existing.status },
    new_value: updates as Record<string, unknown>,
  });
  return data;
}

export async function deleteBlogPost(
  tenantId: string,
  postId: string,
  userId: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  await getBlogPost(tenantId, postId);
  const { error } = await admin
    .from('blog_posts')
    .delete()
    .eq('id', postId)
    .eq('tenant_id', tenantId);
  if (error) throw new Error(`Failed to delete blog post: ${error.message}`);
  await logAudit({
    tenant_id: tenantId,
    user_id: userId,
    action: 'blog.post.deleted',
    resource_type: 'blog_post',
    resource_id: postId,
  });
}
