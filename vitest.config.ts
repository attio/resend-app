import {defineConfig} from "vitest/config"

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        environment: "node",
        // Apps may legitimately ship without unit tests yet (see AGENTS.md: test
        // "where appropriate"). Don't fail CI just because no tests exist.
        passWithNoTests: true,
        server: {
            deps: {
                inline: ["attio"],
            },
        },
        alias: {
            "attio/server": new URL("./src/__mocks__/attio-server.ts", import.meta.url).pathname,
        },
    },
})
