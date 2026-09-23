import type {ResendApiError} from "./error"

export function resendErrorMessage(error: ResendApiError): string {
    switch (error.code) {
        case "INVALID_REQUEST":
            return "Resend rejected the request. Check the values entered on this step."
        case "UNVERIFIED_DOMAIN":
            return "Your Resend domain is not verified."
        case "UNAUTHORIZED":
            return "Unauthorized. Verify you have a valid API key."
        case "FORBIDDEN":
            return "Your Resend API key does not have permission to perform this action."
        case "NOT_FOUND":
            return "Resend could not find that item."
        case "CONCURRENT_REQUEST":
            return "Another request for this contact is already in progress."
        case "RATE_LIMITED":
            return "Hit Resend's rate limit. Try again shortly."
        case "QUOTA_EXCEEDED":
            return "Your Resend plan's sending quota has been reached."
        case "NETWORK_ERROR":
            return "Resend could not be reached."
        case "RESEND_API_ERROR":
            return "Resend is temporarily unavailable."
        case "UNEXPECTED_ERROR":
            return "An unexpected error occurred when calling Resend."
    }
}
