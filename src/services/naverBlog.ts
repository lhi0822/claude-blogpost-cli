import clipboardy from 'clipboardy';
import { BlogPost } from '../types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim();
}

export async function copyPostToClipboard(post: BlogPost): Promise<void> {
  await clipboardy.write(stripHtml(post.content));
}
