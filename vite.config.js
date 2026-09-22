import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// @solana/web3.js and the wallet-adapter packages were written for
// Node and expect Buffer/process/global to exist. This plugin injects
// proper polyfills at the bundler level so it doesn't matter what
// order modules happen to load in — see https://github.com/davidmyersdev/vite-plugin-node-polyfills
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
})
