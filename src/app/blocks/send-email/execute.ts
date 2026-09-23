import {isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {resend} from "../../../resend/client"
import {isRetryable} from "../../../resend/error"
import {resendErrorMessage} from "../../../resend/messages"
import {createLogger} from "../../../utils/logger"
import block from "./block"
import {buildCreateEmailOptions, pickTemplateVariables} from "./create-email-options"

const logger = createLogger("send-email")

export default Workflows.defineWorkflowBlockExecute(block, async ({config, metadata}) => {
    const templateId = config.templateId
    let templateVariables: Record<string, string> | undefined

    if (templateId !== undefined) {
        const template = await resend.getTemplate(templateId)
        if (isErrored(template)) {
            logger.error("send-email failed", {error: template.error})
            return {
                type: "error",
                errorMessage: resendErrorMessage(template.error),
                retryable: isRetryable(template.error),
            }
        }

        const templateVariablesResult = pickTemplateVariables(
            config.templateVariables?.[templateId],
            (template.value.variables ?? []).map((variable) => variable.key)
        )
        if (isErrored(templateVariablesResult)) {
            return {
                type: "error",
                errorMessage: templateVariablesResult.error.message,
                retryable: false,
            }
        }

        templateVariables = templateVariablesResult.value
    }

    const email = buildCreateEmailOptions({
        ...config,
        templateVariables,
    })
    if (isErrored(email)) {
        return {
            type: "error",
            errorMessage: email.error.message,
            retryable: false,
        }
    }

    const result = await resend.sendEmail(email.value, {
        idempotencyKey: metadata.uniqueExecutionId,
    })

    if (isErrored(result)) {
        logger.error("send-email failed", {error: result.error})
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
            email_id: result.value.id,
        },
    }
})
