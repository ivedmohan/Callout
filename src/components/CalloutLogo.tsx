'use client';

interface CalloutLogoProps {
  size?: number;
  className?: string;
}

/**
 * Callout logo built from geometric shapes:
 * - Diamond split into emerald (Yes) and rose (No) halves
 * - Up arrow on left (bullish), down arrow on right (bearish)
 * - Subtle outer ring and "C" accent
 */
export function CalloutLogo({ size = 32, className = '' }: CalloutLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      {/* Background: rounded square */}
      <rect width="512" height="512" rx="112" fill="#0a0f1e" />

      {/* Outer ring */}
      <circle cx="256" cy="256" r="190" stroke="#3b82f6" strokeWidth="16" fill="none" opacity="0.25" />

      {/* Diamond outline */}
      <path d="M256 90 L400 256 L256 422 L112 256 Z" stroke="#3b82f6" strokeWidth="10" fill="#3b82f6" fillOpacity="0.08" />

      {/* Left half — emerald */}
      <path d="M256 130 L148 256 L256 382 Z" fill="#10b981" opacity="0.85" />

      {/* Right half — rose */}
      <path d="M256 130 L364 256 L256 382 Z" fill="#f43f5e" opacity="0.85" />

      {/* Center divider */}
      <line x1="256" y1="118" x2="256" y2="394" stroke="#0a0f1e" strokeWidth="8" />

      {/* Up arrow (left / bullish) */}
      <polygon points="200,280 220,240 240,280" fill="white" opacity="0.9" />
      <rect x="222" y="280" width="16" height="40" rx="3" fill="white" opacity="0.9" />

      {/* Down arrow (right / bearish) */}
      <polygon points="272,232 292,272 312,232" fill="white" opacity="0.9" />
      <rect x="274" y="192" width="16" height="40" rx="3" fill="white" opacity="0.9" />

      {/* Subtle "C" accent */}
      <path d="M310 160 A120 120 0 1 0 310 352" stroke="white" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.12" />
    </svg>
  );
}
