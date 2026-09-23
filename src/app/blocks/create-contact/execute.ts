import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {resend} from "../../../resend/client"
import {isRetryable} from "../../../resend/error"
import {resendErrorMessage} from "../../../resend/messages"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("create-contact")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const result = await resend.createContact({
        email: config.email.normalized,
        firstName: config.name?.first_name,
        lastName: config.name?.last_name,
        unsubscribed: config.unsubscribed,
    })

    if (isErrored(result)) {
        logger.error("create-contact failed", {error: result.error})
        return {
            type: "error",
            errorMessage: resendErrorMessage(result.error),
            retryable: isRetryable(result.error),
        }
    }

    return {
        type: "outcome",
        id: "success",
        data: {
            contact_id: result.value.id,
        },
    }
})
