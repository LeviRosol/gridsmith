import React, { useCallback, useState } from 'react';
import { Button } from 'primereact/button';
import { absoluteUrl } from '../../seo/site.ts';
import { useBlogPostContext } from './BlogPostContext.tsx';

function shareUrl(platform: 'x' | 'facebook' | 'linkedin', pageUrl: string, title: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
}

/** Share links for the current build log post (also available as MDX `<BlogSocialShare />`). */
export default function BlogSocialShare() {
  const { slug, title } = useBlogPostContext();
  const pageUrl = absoluteUrl(`/blog/${slug}`);
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', pageUrl);
    }
  }, [pageUrl]);

  return (
    <aside className="blog-social-share" aria-label="Share this post">
      <p className="text-sm font-semibold text-color m-0 mb-2">Share</p>
      <div className="flex flex-wrap align-items-center gap-2">
        <Button
          type="button"
          label="X"
          icon="pi pi-twitter"
          outlined
          size="small"
          aria-label="Share on X"
          onClick={() => window.open(shareUrl('x', pageUrl, title), '_blank', 'noopener,noreferrer')}
        />
        <Button
          type="button"
          label="Facebook"
          icon="pi pi-facebook"
          outlined
          size="small"
          aria-label="Share on Facebook"
          onClick={() => window.open(shareUrl('facebook', pageUrl, title), '_blank', 'noopener,noreferrer')}
        />
        <Button
          type="button"
          label="LinkedIn"
          icon="pi pi-linkedin"
          outlined
          size="small"
          aria-label="Share on LinkedIn"
          onClick={() => window.open(shareUrl('linkedin', pageUrl, title), '_blank', 'noopener,noreferrer')}
        />
        <Button
          type="button"
          label={copied ? 'Copied!' : 'Copy link'}
          icon={copied ? 'pi pi-check' : 'pi pi-link'}
          outlined
          size="small"
          onClick={() => void copyLink()}
        />
      </div>
    </aside>
  );
}
