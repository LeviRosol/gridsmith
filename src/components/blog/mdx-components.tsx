import React from 'react';
import type { MDXComponents } from '@mdx-js/react';
import { MarketingPhoto } from '../home/marketing-blocks.tsx';

/** Maps MDX elements to PrimeReact-friendly markup (inline images, prose). */
export const blogMdxComponents: MDXComponents = {
  h2: (props) => <h2 className="text-2xl font-bold text-color mt-5 mb-3 m-0" {...props} />,
  h3: (props) => <h3 className="text-xl font-semibold text-color mt-4 mb-2 m-0" {...props} />,
  p: (props) => <p className="text-color-secondary line-height-3 m-0 mb-3" {...props} />,
  ul: (props) => <ul className="blog-mdx-list text-color-secondary line-height-3 m-0 mb-3 pl-4" {...props} />,
  ol: (props) => <ol className="blog-mdx-list text-color-secondary line-height-3 m-0 mb-3 pl-4" {...props} />,
  li: (props) => <li className="mb-2" {...props} />,
  a: (props) => (
    <a className="text-primary no-underline hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  img: ({ src, alt, title }) => {
    if (!src) return null;
    return (
      <figure className="blog-mdx-figure m-0 mb-4">
        <MarketingPhoto
          src={src}
          alt={alt ?? title ?? ''}
          imageClassName="w-full border-round blog-mdx-inline-image"
        />
        {alt ? <figcaption className="text-sm text-color-secondary mt-2">{alt}</figcaption> : null}
      </figure>
    );
  },
};
