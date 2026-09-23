import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "create-contact",
    title: "Create contact",
    description: "Create a contact in Resend",
    configSchema: Workflows.ConfigSchema.struct({
        email: Workflows.ConfigSchema.emailAddress(),
        name: Workflows.ConfigSchema.personalName().optional(),
        unsubscribed: Workflows.ConfigSchema.boolean().optional(),
    }),
})
