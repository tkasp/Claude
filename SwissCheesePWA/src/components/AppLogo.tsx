import React from 'react'
import { logoSvg } from '../lib/logo'

export function AppLogo({ size = 32 }: { size?: number }): React.ReactElement {
  return (
    <span
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: logoSvg(size) }}
    />
  )
}
