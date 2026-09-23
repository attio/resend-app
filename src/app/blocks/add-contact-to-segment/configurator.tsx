import {Workflows} from "attio/client"
import type {ReactElement} from "react"
import {useContactOptions, useSegmentOptions} from "../../../utils/options"
import block from "./block"

export default Workflows.defineConfigurator(block, (workflowBlock): ReactElement => {
    const {ComboboxInput, Outcome} = Workflows.useConfigurator(workflowBlock)
    const segmentOptions = useSegmentOptions()
    const contactOptions = useContactOptions()

    return (
        <>
            <ComboboxInput
                name="segmentId"
                label="Segment"
                placeholder="Select a segment..."
                searchPlaceholder="Search segments..."
                options={segmentOptions}
                disableVariables
            />
            <ComboboxInput
                name="contactId"
                label="Contact"
                help="Search for a Resend contact, or insert a contact ID from an earlier step."
                placeholder="Select a contact..."
                searchPlaceholder="Search contacts..."
                options={contactOptions}
            />
            <Outcome
                id="success"
                label="Success"
                schema={{
                    segment_id: Workflows.OutcomeSchema.string().title("Segment ID"),
                }}
            />
        </>
    )
})
