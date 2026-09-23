import type {AsyncResult} from "@attio/fetchable"

export type ResendApiError =
    | {code: "INVALID_REQUEST"}
    | {code: "UNVERIFIED_DOMAIN"}
    | {code: "UNAUTHORIZED"}
    | {code: "FORBIDDEN"}
    | {code: "NOT_FOUND"}
    | {code: "CONCURRENT_REQUEST"}
    | {code: "RATE_LIMITED"}
    | {code: "QUOTA_EXCEEDED"}
    | {code: "NETWORK_ERROR"}
    | {code: "RESEND_API_ERROR"}
    | {code: "UNEXPECTED_ERROR"}

export type ResendResult<TValue> = AsyncResult<TValue, ResendApiError>

export function isRetryable(error: ResendApiError): boolean {
    switch (error.code) {
        case "CONCURRENT_REQUEST":
        case "RATE_LIMITED":
        case "NETWORK_ERROR":
        case "RESEND_API_ERROR":
            return true
        case "QUOTA_EXCEEDED":
        case "INVALID_REQUEST":
        case "UNVERIFIED_DOMAIN":
        case "UNAUTHORIZED":
        case "FORBIDDEN":
        case "NOT_FOUND":
        case "UNEXPECTED_ERROR":
            return false
    }
}
