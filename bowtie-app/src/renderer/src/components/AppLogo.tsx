import React from 'react'

/** Minimalist mark: a clean bowtie (two triangles meeting at a centre event)
 *  with a few "Swiss-cheese" holes punched through each lobe. */
export function AppLogo({ size = 28 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left lobe */}
      <path d="M7 11 L23 24 L7 37 Z" fill="#3b82f6" />
      <circle cx="11.5" cy="19" r="1.9" fill="#f4f5f7" />
      <circle cx="11" cy="29" r="1.5" fill="#f4f5f7" />

      {/* Right lobe */}
      <path d="M41 11 L25 24 L41 37 Z" fill="#ef4444" />
      <circle cx="36.5" cy="19" r="1.9" fill="#f4f5f7" />
      <circle cx="37" cy="29" r="1.5" fill="#f4f5f7" />

      {/* Centre event */}
      <circle cx="24" cy="24" r="5" fill="#0f172a" />
      <circle cx="24" cy="24" r="2.4" fill="#f59e0b" />
    </svg>
  )
}
