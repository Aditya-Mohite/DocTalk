// To make sure that we always have the data in the body of the messagae
// This is the validator using the schema validator zod
// This ensures that we have access to the body and it is not emty

import { z } from "zod"

// Defining the schema that we always recieve through endpoint

export const SendMessageValidator = z.object({
    // in api request we get the fileId and the message
    fileId: z.string(),
    message: z.string()
})