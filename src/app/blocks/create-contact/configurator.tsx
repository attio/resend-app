import {Workflows} from "attio/client"
import type {ReactElement} from "react"
import block from "./block"

export default Workflows.defineConfigurator(block, (workflowBlock): ReactElement => {
    const {EmailAddressInput, PersonalNameInput, CheckboxInput, Outcome} =
        Workflows.useConfigurator(workflowBlock)

    return (
        <>
            <EmailAddressInput name="email" label="Email" />
            <PersonalNameInput name="name" label="Full name" />
            <CheckboxInput
                name="unsubscribed"
                label="Unsubscribed"
                help="If set, the contact will be unsubscribed from all Broadcasts."
                disableVariables
            />
            <Outcome
                id="success"
                label="Success"
                schema={{
                    contact_id: Workflows.OutcomeSchema.string().title("Contact ID"),
                }}
            />
        </>
    )
})
