import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [
        dts({
            include: ["index.ts", "schema.ts", "types.ts"],
        }),
    ],
    build: {
        lib: {
            entry: "index.ts",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
        },
        rollupOptions: {
            external: ["zod"],
        },
        sourcemap: true,
    },
})
