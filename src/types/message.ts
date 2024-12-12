// Get the type of the message that we get from the route api endpoint

import { appRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<appRouter>

// type of message
type Messages = RouterOutput["getFileMessages"]["messages"]

type OmitText = Omit<Messages[number], "text">

type ExtendedText = {
    text: string | JSX.Element
}

export type ExtendedMessage = OmitText & ExtendedText