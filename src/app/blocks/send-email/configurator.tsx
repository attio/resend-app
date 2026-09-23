import {isErrored} from "@attio/fetchable"
import {showToast, useAsyncCache, Workflows} from "attio/client"
import {useEffect, type ReactElement} from "react"
import {resendErrorMessage} from "../../../resend/messages"
import getTemplate from "../../../server-functions/get-template.server"
import {useTemplateOptions, useTopicOptions} from "../../../utils/options"
import block from "./block"
import {EMAIL_BODY_REQUIRED} from "./create-email-options"

/** Renders inputs for variables declared by the statically selected Resend template. */
function SelectedTemplateVariables({templateId}: {templateId: string}) {
    const {TextInput} = Workflows.useConfigurator(block)
    const cacheKey = `template-${templateId}`
    const {values, invalidate} = useAsyncCache({
        [cacheKey]: [getTemplate, templateId],
    })
    const result = values[cacheKey]
    const errorMessage = isErrored(result) ? resendErrorMessage(result.error) : undefined

    useEffect(() => {
        if (errorMessage === undefined) {
            return
        }

        showToast({
            title: "Could not load Resend template",
            text: errorMessage,
            variant: "error",
            durationMs: 10_000,
        })

        return () => invalidate(cacheKey)
    }, [cacheKey, errorMessage, invalidate])

    if (isErrored(result)) {
        return null
    }

    const keys = (result.value.variables ?? []).map((variable) => variable.key)
    if (keys.length === 0) {
        return null
    }

    return (
        <>
            {keys.map((key) => (
                <TextInput key={key} name={`templateVariables.${templateId}.${key}`} label={key} />
            ))}
        </>
    )
}

export default Workflows.defineConfigurator(block, (workflowBlock): ReactElement => {
    const {
        ComboboxInput,
        CollectionInput,
        EmailAddressInput,
        TextInput,
        TimestampInput,
        Outcome,
        watch,
    } = Workflows.useConfigurator(workflowBlock, {
        cc: [],
        bcc: [],
        replyTo: [],
        templateVariables: {},
        tags: [],
        attachments: [],
    })
    const topicOptions = useTopicOptions()
    const templateOptions = useTemplateOptions()
    const templateConfig = watch("templateId")
    const templateId =
        templateConfig?.type === "static" && templateConfig.value !== ""
            ? templateConfig.value
            : undefined

    return (
        <>
            <EmailAddressInput
                name="from"
                label="From"
                help="Must be an address on a domain you've verified in Resend."
            />
            <EmailAddressInput name="to" label="To" />
            <TextInput name="subject" label="Subject" />
            <TextInput
                name="text"
                label="Plain text"
                help={`${EMAIL_BODY_REQUIRED} A template cannot be sent with plain text.`}
            />
            <ComboboxInput
                name="templateId"
                label="Template"
                help={`${EMAIL_BODY_REQUIRED} A template cannot be sent with plain text. Only published templates can be used.`}
                placeholder="Select a template..."
                searchPlaceholder="Search templates..."
                options={templateOptions}
                disableVariables
            />
            {templateId !== undefined ? (
                <SelectedTemplateVariables templateId={templateId} />
            ) : null}
            <TextInput name="fromName" label="From name" />
            <EmailAddressInput name="cc" label="CC" multi />
            <EmailAddressInput name="bcc" label="BCC" multi />
            <EmailAddressInput name="replyTo" label="Reply to" multi />
            <TimestampInput name="scheduledAt" label="Schedule" />
            <CollectionInput name="tags" label="Tags" addItemLabel="Add tag">
                {(item) => (
                    <>
                        <TextInput name={`${item}.name`} label="Name" />
                        <TextInput name={`${item}.value`} label="Value" />
                    </>
                )}
            </CollectionInput>
            <ComboboxInput
                name="topicId"
                label="Topic"
                placeholder="Select a topic..."
                searchPlaceholder="Search topics..."
                options={topicOptions}
                disableVariables
            />
            <CollectionInput name="attachments" label="Attachments" addItemLabel="Add attachment">
                {(item) => (
                    <>
                        <TextInput name={`${item}.filename`} label="Filename" />
                        <TextInput name={`${item}.path`} label="URL" help="Remote file URL only" />
                    </>
                )}
            </CollectionInput>
            <Outcome
                id="success"
                schema={{
                    email_id: Workflows.OutcomeSchema.string().title("Email ID"),
                }}
            />
        </>
    )
})
