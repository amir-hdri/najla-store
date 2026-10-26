import { motion } from 'framer-motion';

type BrandMarkSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: BrandMarkSize;
  className?: string;
  animated?: boolean;
}

const SIZES: Record<BrandMarkSize, { box: string; pad: string }> = {
  sm: { box: 'size-10', pad: 'p-1' },
  md: { box: 'size-14', pad: 'p-1.5' },
  lg: { box: 'size-[4.5rem]', pad: 'p-2' },
};

export function BrandMark({ size = 'sm', className = '', animated = false }: BrandMarkProps) {
  const { box, pad } = SIZES[size];

  const plate = (
    <span className={`group/medal relative grid ${box} shrink-0 place-items-center`}>
      <span
        className={`brand-medal grid size-full place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold via-primary to-gold p-px shadow-[0_6px_18px_-10px_rgb(36_24_18/0.55)]`}
      >
        <span className="relative grid size-full place-items-center overflow-hidden rounded-full bg-cream">
          <img
            src="/images/brand/najla-mark.webp"
            alt=""
            className={`absolute inset-0 size-full object-contain ${pad}`}
            width={152}
            height={200}
          />
        </span>
      </span>
    </span>
  );

  if (!animated) return plate;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.72, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      className={className}
    >
      {plate}
    </motion.span>
  );
}
