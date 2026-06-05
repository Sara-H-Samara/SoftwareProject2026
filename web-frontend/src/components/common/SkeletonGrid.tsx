import { SkeletonCard } from './SkeletonCard';

interface SkeletonGridProps {
  count?: number;
  variant?: 'gallery' | 'artwork' | 'profile';
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function SkeletonGrid({ 
  count = 12, 
  variant = 'gallery',
  columns = { sm: 1, md: 2, lg: 3, xl: 4 }
}: SkeletonGridProps) {
  const getGridClass = () => {
    return `grid gap-5 
      grid-cols-${columns.sm || 1} 
      sm:grid-cols-${columns.md || 2} 
      lg:grid-cols-${columns.lg || 3} 
      xl:grid-cols-${columns.xl || 4}`;
  };

  return (
    <div className={getGridClass()}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}