import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(async ({ command }) => {
  const plugins = [devtools(), tailwindcss(), tanstackStart(), viteReact()]

  // The Cloudflare Vite plugin can block ordinary local dev startup in this environment.
  // Keep local `vite dev` fast and load the Cloudflare runtime plugin only outside serve mode.
  if (command !== 'serve') {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    plugins.splice(1, 0, cloudflare({ viteEnvironment: { name: 'ssr' } }))
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins,
  }
})

export default config
