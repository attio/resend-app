import {isErrored} from "@attio/fetchable"
import {describe, expect, it} from "vitest"
import {pickTemplateVariables} from "./create-email-options"

describe(pickTemplateVariables, () => {
    it("ignores saved keys that the current template no longer expects", () => {
        const result = pickTemplateVariables({first_name: "Ada", amount: "12"}, ["amount"])

        expect(!isErrored(result) && result.value).toEqual({amount: "12"})
    })

    it("errors when a template key has no saved value", () => {
        const result = pickTemplateVariables({}, ["amount"])

        expect(isErrored(result) && result.error.message).toBe(
            "Template updated. Set the amount variable in the editor."
        )
    })

    it("names all new template keys that have no saved value", () => {
        const result = pickTemplateVariables({}, ["amount", "currency"])

        expect(isErrored(result) && result.error.message).toBe(
            "Template updated. Set these variables in the editor: amount, currency."
        )
    })
})
