interface PawIconProps {
  size?: number;
  className?: string;
}

export function PawIcon({ size = 28, className }: PawIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="14" cy="17" rx="7" ry="6" fill="currentColor" />
      <ellipse cx="7" cy="11" rx="3.5" ry="4.5" fill="currentColor" />
      <ellipse cx="21" cy="11" rx="3.5" ry="4.5" fill="currentColor" />
      <ellipse cx="10.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" />
      <ellipse cx="17.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" />
    </svg>
  );
}
