import React from 'react'
import { logoSvg } from '../lib/logo'

/** Swiss-Cheese bow-tie logo: amber ribbon with swiss-cheese holes on a dark
 *  rounded-square plate. Single-sourced from lib/logo so the report and app
 *  icon stay identical. */
export function AppLogo({ size = 32 }: { size?: number }): React.ReactElement {
  return (
    <span
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: logoSvg(size) }}
    />
  )
}
