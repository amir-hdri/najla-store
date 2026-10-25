interface ProductArtProps {
  svg: string;
  /** Accessible label; when omitted the art is treated as decorative. */
  alt?: string;
  className?: string;
}

/** Renders build-time constant SVG art (never user input). */
export function ProductArt({ svg, alt, className }: ProductArtProps) {
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
