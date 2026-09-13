import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [
        react(),
        dts({ include: ["index.tsx", "components/**/*.tsx"] }),
    ],
    build: {
        lib: {
            entry: "index.tsx",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
        },
        rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "core"],
        },
        sourcemap: true,
    },
})
