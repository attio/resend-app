import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {resend} from "../../../resend/client"
import {isRetryable} from "../../../resend/error"
import {resendErrorMessage} from "../../../resend/messages"
import {createLogger} from "../../../utils/logger"
import block from "./block"

const logger = createLogger("add-contact-to-segment")

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const result = await resend.addContactToSegment({
        contactId: config.contactId,
        segmentId: config.segmentId,
    })

    if (isErrored(result)) {
        logger.error("add-contact-to-segment failed", {error: result.error})
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
            // Resend's docs say the response is `{id}` and that id is the segment. In
            // practice it's `{id, audienceId}` and id is the contact. We can't use
            // audienceId (undocumented) and we can't treat id as the segment, so echo
            // the segment we already sent.
            segment_id: config.segmentId,
        },
    }
})
