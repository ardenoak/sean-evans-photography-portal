import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: 'auto' | 'dark' | 'light'; // auto detects dark backgrounds, dark = white logo, light = black logo
}

export default function Logo({ 
  width = 180, 
  height = 60, 
  className = '', 
  variant = 'auto' 
}: LogoProps) {
  // Auto-detect if we're on a dark background by checking parent classes
  let logoStyle = {};
  
  if (variant === 'auto') {
    // Default to checking common dark background patterns
    logoStyle = {
      filter: 'var(--logo-filter, none)',
    };
  } else if (variant === 'dark') {
    // White logo for dark backgrounds
    logoStyle = {
      filter: 'brightness(0) invert(1)',
    };
  } else {
    // Default black logo for light backgrounds
    logoStyle = {};
  }

  return (
    <Image 
      src="/sean-evans-logo.png" 
      alt="Sean Evans Photography" 
      width={width} 
      height={height}
      className={`${className}`}
      style={logoStyle}
    />
  );
}