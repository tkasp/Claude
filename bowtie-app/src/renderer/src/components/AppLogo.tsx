import React from 'react'

/** Combines the process-safety Swiss-Cheese model (holes in the layers)
 *  with the Bowtie diagram concept (two triangles meeting at a central event). */
export function AppLogo({ size = 28 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left bowtie lobe — threat side — dark blue */}
      <path d="M2 4 L20 20 L2 36 Z" fill="#1d4ed8" />
      {/* Swiss-cheese holes in left lobe */}
      <circle cx="7.5" cy="11" r="2.2" fill="white" fillOpacity="0.75" />
      <circle cx="5"   cy="22" r="1.5" fill="white" fillOpacity="0.65" />
      <circle cx="10"  cy="28" r="1.8" fill="white" fillOpacity="0.70" />

      {/* Right bowtie lobe — consequence side — crimson */}
      <path d="M38 4 L20 20 L38 36 Z" fill="#b91c1c" />
      {/* Swiss-cheese holes in right lobe */}
      <circle cx="32.5" cy="11" r="2.2" fill="white" fillOpacity="0.75" />
      <circle cx="35"   cy="22" r="1.5" fill="white" fillOpacity="0.65" />
      <circle cx="30"   cy="28" r="1.8" fill="white" fillOpacity="0.70" />

      {/* Top-event circle — orange (undesired event centre) */}
      <circle cx="20" cy="20" r="5.5" fill="#f97316" />
      <circle cx="20" cy="20" r="3.5" fill="#fff7ed" fillOpacity="0.55" />
    </svg>
  )
}
