interface GradientSparklesProps {
  className?: string;
}

export default function GradientSparkles({
  className = '',
}: GradientSparklesProps) {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <defs>
        <linearGradient id='sparkleGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='#3b82f6' />
          <stop offset='100%' stopColor='#ef4444' />
        </linearGradient>
      </defs>
      {/* Simple plus sparkles */}
      <path
        d='M12 4v16M4 12h16'
        stroke='url(#sparkleGradient)'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M7 7l2 2M17 7l-2 2M7 17l2-2M17 17l-2-2'
        stroke='url(#sparkleGradient)'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}
