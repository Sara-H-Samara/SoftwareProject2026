interface BadgeProps {
  type: 'verified' | 'top' | 'rising' | 'popular' | 'master';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const badgeConfig = {
  verified: {
    icon: '✓',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Verified',
    description: 'Official verified artist account',
  },
  top: {
    icon: '🏆',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Top Artist',
    description: 'Among the top artists on the platform',
  },
  rising: {
    icon: '📈',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: 'Rising Star',
    description: 'Fastest growing artist this month',
  },
  popular: {
    icon: '🔥',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Popular',
    description: 'Consistently receives high engagement',
  },
  master: {
    icon: '👑',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    label: 'Master',
    description: 'Exceptional quality and recognition',
  },
};

export default function Badge({ type, size = 'md', showTooltip = false }: BadgeProps) {
  const config = badgeConfig[type];
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  };

  const iconSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const badge = (
    <div
      className={`inline-flex items-center rounded-full ${config.color} font-medium ${sizeClasses[size]} border shadow-sm`}
    >
      <span className={iconSize[size]}>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative inline-flex group">
        {badge}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
          {config.description}
        </div>
      </div>
    );
  }

  return badge;
}