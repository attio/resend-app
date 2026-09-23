import {isErrored} from "@attio/fetchable"
import {afterEach, describe, expect, it, vi} from "vitest"
import {callResend} from "./wrap"

const mocks = vi.hoisted(() => ({logger: {log: vi.fn(), error: vi.fn()}}))

vi.mock("../utils/logger", () => ({createLogger: () => mocks.logger}))

function errorResponse(name: string, status: number): Response {
    return new Response(JSON.stringify({statusCode: status, name, message: "Resend said no"}), {
        status,
        headers: {"Content-Type": "application/json"},
    })
}

function createContact() {
    return callResend("create contact", (client) => client.contacts.create({email: "a@b.com"}))
}

describe(callResend, () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it("maps Resend's error codes onto semantic errors", async () => {
        const cases: Array<{name: string; status: number; code: string}> = [
            {name: "invalid_api_key", status: 401, code: "UNAUTHORIZED"},
            {name: "missing_api_key", status: 401, code: "UNAUTHORIZED"},
            {name: "restricted_api_key", status: 403, code: "FORBIDDEN"},
            {name: "invalid_access", status: 403, code: "FORBIDDEN"},
            {name: "security_error", status: 403, code: "FORBIDDEN"},
            {name: "not_found", status: 404, code: "NOT_FOUND"},
            {name: "validation_error", status: 400, code: "INVALID_REQUEST"},
            {name: "missing_required_field", status: 422, code: "INVALID_REQUEST"},
            {name: "rate_limit_exceeded", status: 429, code: "RATE_LIMITED"},
            {name: "daily_quota_exceeded", status: 429, code: "QUOTA_EXCEEDED"},
            {name: "monthly_quota_exceeded", status: 429, code: "QUOTA_EXCEEDED"},
            {name: "concurrent_idempotent_requests", status: 409, code: "CONCURRENT_REQUEST"},
            {name: "internal_server_error", status: 500, code: "RESEND_API_ERROR"},
            {name: "method_not_allowed", status: 405, code: "UNEXPECTED_ERROR"},
        ]

        for (const {name, status, code} of cases) {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(name, status)))

            const result = await createContact()

            expect(isErrored(result) && result.error.code, name).toBe(code)
        }
    })

    // Resend's client reports both an unreachable host and an unreadable 5xx as
    // `application_error`, and only the absent status tells them apart.
    it("separates an unreachable host from a bad response by status", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")))
        const unreachable = await createContact()
        expect(isErrored(unreachable) && unreachable.error.code).toBe("NETWORK_ERROR")

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("Bad Gateway", {status: 502}))
        )
        const badResponse = await createContact()
        expect(isErrored(badResponse) && badResponse.error.code).toBe("RESEND_API_ERROR")
    })
})
