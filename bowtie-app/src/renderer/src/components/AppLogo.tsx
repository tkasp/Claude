import React from 'react'

/** Swiss-Cheese bowtie logo: ribbon shape with swiss-cheese holes on a dark
 *  rounded-square background. */
export function AppLogo({ size = 28 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark rounded background */}
      <rect width="48" height="48" rx="10" fill="#0f172a" />

      {/* Left lobe: wide at left, tapers to waist at center */}
      <path
        d="M 22 21 C 16 17 9 13 4 11 L 4 37 C 9 35 16 31 22 27 Z"
        fill="#f59e0b"
      />

      {/* Right lobe: mirrors left */}
      <path
        d="M 26 21 C 32 17 39 13 44 11 L 44 37 C 39 35 32 31 26 27 Z"
        fill="#f59e0b"
      />

      {/* Waist connector — small rect bridging the two lobes */}
      <rect x="22" y="21" width="4" height="6" fill="#f59e0b" />

      {/* Swiss-cheese holes — left lobe */}
      <circle cx="8.5" cy="19" r="2.1" fill="#0f172a" />
      <circle cx="13" cy="29" r="1.8" fill="#0f172a" />
      <circle cx="16" cy="15" r="1.4" fill="#0f172a" />
      <circle cx="7.5" cy="31.5" r="1.2" fill="#0f172a" />

      {/* Swiss-cheese holes — right lobe */}
      <circle cx="39.5" cy="19" r="2.1" fill="#0f172a" />
      <circle cx="35" cy="29" r="1.8" fill="#0f172a" />
      <circle cx="32" cy="15" r="1.4" fill="#0f172a" />
      <circle cx="40.5" cy="31.5" r="1.2" fill="#0f172a" />
    </svg>
  )
}
