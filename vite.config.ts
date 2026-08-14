// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    // Nitro picks the Lambda runtime from the build machine's own Node version
    // (nodejs24.x on Vercel's current build image), which was hitting a
    // CJS-interop bundling bug in @floating-ui/react-dom. Pin to a version
    // that's tested and known to work. `vercel` is a real, documented nitro
    // preset option — @lovable.dev/vite-tanstack-config's type for `nitro`
    // just doesn't declare it, though it passes the object through untouched.
    // @ts-expect-error -- see comment above
    vercel: {
      functions: { runtime: "nodejs22.x" },
    },
  },
});
