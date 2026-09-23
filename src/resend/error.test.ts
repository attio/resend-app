import {describe, expect, it} from "vitest"
import {isRetryable} from "./error"

describe(isRetryable, () => {
    it("marks rate limits, transport failures, and Resend-side faults as retryable", () => {
        expect(isRetryable({code: "RATE_LIMITED"})).toBe(true)
        expect(isRetryable({code: "NETWORK_ERROR"})).toBe(true)
        expect(isRetryable({code: "RESEND_API_ERROR"})).toBe(true)
        expect(isRetryable({code: "CONCURRENT_REQUEST"})).toBe(true)
    })

    it("does not retry a spent quota, which a retry cannot clear", () => {
        expect(isRetryable({code: "QUOTA_EXCEEDED"})).toBe(false)
    })

    it("does not mark configuration or auth failures as retryable", () => {
        expect(isRetryable({code: "INVALID_REQUEST"})).toBe(false)
        expect(isRetryable({code: "UNVERIFIED_DOMAIN"})).toBe(false)
        expect(isRetryable({code: "UNAUTHORIZED"})).toBe(false)
        expect(isRetryable({code: "FORBIDDEN"})).toBe(false)
        expect(isRetryable({code: "NOT_FOUND"})).toBe(false)
        expect(isRetryable({code: "UNEXPECTED_ERROR"})).toBe(false)
    })
})
