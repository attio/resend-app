import {isErrored} from "@attio/fetchable"
import {afterEach, describe, expect, it, vi} from "vitest"
import {resend} from "./client"

const mocks = vi.hoisted(() => ({logger: {log: vi.fn(), error: vi.fn()}}))

vi.mock("../utils/logger", () => ({createLogger: () => mocks.logger}))

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {"Content-Type": "application/json"},
    })
}

function contact(id: string) {
    return {id, email: "a@b.com", first_name: "Ada", last_name: "Lovelace"}
}

function listed(data: unknown[], hasMore = false) {
    return {object: "list", has_more: hasMore, data}
}

describe(resend.listContacts, () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
        vi.clearAllMocks()
    })

    it("walks pages until has_more is false", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(listed([contact("ct-1")], true)))
            .mockResolvedValueOnce(jsonResponse(listed([contact("ct-2")])))
        vi.stubGlobal("fetch", fetchMock)

        const result = await resend.listContacts()

        expect(!isErrored(result) && result.value.map((item) => item.id)).toEqual(["ct-1", "ct-2"])
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain("after=ct-1")
    })

    it("stops listing once the time budget is spent, keeping what it has", async () => {
        let now = 0
        vi.spyOn(Date, "now").mockImplementation(() => now)

        const fetchMock = vi.fn().mockImplementation(() => {
            now += 6_000
            return Promise.resolve(jsonResponse(listed([contact(`ct-${now}`)], true)))
        })
        vi.stubGlobal("fetch", fetchMock)

        const result = await resend.listContacts()

        expect(!isErrored(result) && result.value).toHaveLength(2)
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it("gives up on the first failed page rather than returning a partial list as a success", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse(listed([contact("ct-1")], true)))
                .mockResolvedValueOnce(
                    jsonResponse(
                        {statusCode: 429, name: "rate_limit_exceeded", message: "slow down"},
                        429
                    )
                )
        )

        const result = await resend.listContacts()

        expect(isErrored(result) && result.error.code).toBe("RATE_LIMITED")
    })
})
