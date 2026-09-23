import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "add-contact-to-segment",
    title: "Add contact to segment",
    description: "Add a contact to a segment in Resend",
    configSchema: Workflows.ConfigSchema.struct({
        segmentId: Workflows.ConfigSchema.string(),
        contactId: Workflows.ConfigSchema.string(),
    }),
})
