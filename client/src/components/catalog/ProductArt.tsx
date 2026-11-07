import { useState } from 'react';

interface ProductArtProps {
  svg: string;
  photo?: string;
  /** Accessible label; when omitted the art is treated as decorative. */
  alt?: string;
  className?: string;
}

/** Renders authentic photography when available, with build-time SVG art fallback. */
export function ProductArt({ svg, photo, alt, className }: ProductArtProps) {
  const [error, setError] = useState(false);

  if (photo && !error) {
    return (
      <div className={className}>
        <img
          src={photo}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          onError={() => setError(true)}
          className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      // eslint-disable-next-line react/no-danger -- art is a build-time constant from productArt.ts
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
