import {type AsyncResult, complete, errored} from "@attio/fetchable"
import {getWorkspaceConnection} from "attio/server"
import {type ErrorResponse, Resend, type Response as ResendResponse} from "resend"
import {createLogger} from "../utils/logger"
import type {ResendApiError} from "./error"

const logger = createLogger("resend")

function mapResendError(error: ErrorResponse): ResendApiError {
    switch (error.name) {
        case "missing_api_key":
        case "invalid_api_key":
            return {code: "UNAUTHORIZED"}
        case "restricted_api_key":
        case "invalid_access":
        case "security_error":
            return {code: "FORBIDDEN"}
        case "not_found":
            return {code: "NOT_FOUND"}
        case "concurrent_idempotent_requests":
            return {code: "CONCURRENT_REQUEST"}
        case "rate_limit_exceeded":
            return {code: "RATE_LIMITED"}
        case "daily_quota_exceeded":
        case "monthly_quota_exceeded":
            return {code: "QUOTA_EXCEEDED"}
        case "validation_error":
        case "missing_required_field":
        case "invalid_parameter":
        case "invalid_region":
        case "invalid_attachment":
        case "invalid_from_address":
        case "invalid_idempotency_key":
        case "invalid_idempotent_request":
            return /domain is not verified/i.test(error.message)
                ? {code: "UNVERIFIED_DOMAIN"}
                : {code: "INVALID_REQUEST"}
        case "application_error":
            // API docs: HTTP 500 — https://resend.com/docs/api-reference/errors#application_error
            // Node SDK also uses this name when fetch throws, with statusCode null:
            // https://github.com/resend/resend-node/blob/5bc4c27d9bedb0f7288609a8d3e1c16adc3ad7e7/src/resend.ts#L183-L196
            return error.statusCode === null ? {code: "NETWORK_ERROR"} : {code: "RESEND_API_ERROR"}
        case "internal_server_error":
            return {code: "RESEND_API_ERROR"}
        case "method_not_allowed":
            return {code: "UNEXPECTED_ERROR"}
        default:
            logger.error(`unrecognised Resend error code: ${error.name}`)
            return {code: "UNEXPECTED_ERROR"}
    }
}

export async function callResend<TValue>(
    label: string,
    fn: (client: Resend) => Promise<ResendResponse<TValue>>
): AsyncResult<TValue, ResendApiError> {
    const apiKey = getWorkspaceConnection().value

    try {
        const response = await fn(
            new Resend(apiKey, {
                baseUrl: "https://api.resend.com",
                userAgent: "resend-node:6.20.0",
            })
        )

        if (response.error !== null) {
            const mapped = mapResendError(response.error)
            logger.error(`${label} failed (${mapped.code})`)
            return errored(mapped)
        }

        return complete(response.data)
    } catch (cause) {
        logger.error(`${label} could not call Resend`, cause)
        const missingKey = cause instanceof Error && cause.message.startsWith("Missing API key")
        return errored({code: missingKey ? "UNAUTHORIZED" : "UNEXPECTED_ERROR"})
    }
}
