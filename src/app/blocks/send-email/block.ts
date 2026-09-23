import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "send-email",
    title: "Send email",
    description: "Send an email in Resend",
    configSchema: Workflows.ConfigSchema.struct({
        from: Workflows.ConfigSchema.emailAddress(),
        to: Workflows.ConfigSchema.emailAddress(),
        subject: Workflows.ConfigSchema.string(),
        fromName: Workflows.ConfigSchema.string().optional(),
        cc: Workflows.ConfigSchema.array(Workflows.ConfigSchema.emailAddress()),
        bcc: Workflows.ConfigSchema.array(Workflows.ConfigSchema.emailAddress()),
        replyTo: Workflows.ConfigSchema.array(Workflows.ConfigSchema.emailAddress()),
        scheduledAt: Workflows.ConfigSchema.timestamp().optional(),
        text: Workflows.ConfigSchema.string().optional(),
        templateId: Workflows.ConfigSchema.string().optional(),
        templateVariables: Workflows.ConfigSchema.record(
            Workflows.ConfigSchema.record(Workflows.ConfigSchema.string())
        ),
        tags: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                name: Workflows.ConfigSchema.string(),
                value: Workflows.ConfigSchema.string(),
            })
        ),
        topicId: Workflows.ConfigSchema.string().optional(),
        attachments: Workflows.ConfigSchema.array(
            Workflows.ConfigSchema.struct({
                filename: Workflows.ConfigSchema.string(),
                path: Workflows.ConfigSchema.string(),
            })
        ),
    }),
})
