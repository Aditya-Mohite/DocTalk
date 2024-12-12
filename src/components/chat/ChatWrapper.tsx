"use client"

import Messages from "./Messages"
import ChatInput from "./ChatInput"
import { trpc } from "@/app/_trpc/client"
import { useEffect, useMemo, useContext } from "react"
import { ChevronLeft, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "../ui/button"
import { ChatContextProvider } from "./ChatContext"


interface ChatWrapperProps {
    fileId: string
}

const ChatWrapper = ({ fileId }: ChatWrapperProps) => {

    // Use trpc route to get file upload status
    const { data, isLoading } = trpc.getFileUploadStatus.useQuery({
        fileId,
    },
        {
            // Enable refetching on every render
            // we can get the value that is returned by trpc route --> (file status)
            refetchInterval: (data) =>
                data.state.data?.status === "SUCCESS" || data.state.data?.status === "FAILED" ? false : 500
        },
    )

    // Loading state
    if(isLoading) 
        return(
        <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 flex justify-center items-center flex-col mb-28">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin"/>
                    <h3 className="font-semibold text-xl">Loading...</h3>
                    <p className="text-zinc-500 text-sm">
                        We're preparing your PDF.
                    </p>
                </div>
            </div>

            <ChatInput isDisabled/>
        </div>
    )

    // Processing state
    if(data?.status === "PROCESSING")
         return (
        <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 flex justify-center items-center flex-col mb-28">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin"/>
                    <h3 className="font-semibold text-xl">Processing PDF...</h3>
                    <p className="text-zinc-500 text-sm">
                        This won't take long.
                    </p>
                </div>
            </div>

            <ChatInput isDisabled/>
        </div>
    )

    // Failed state
    if(data?.status === "FAILED") 
        return (
        <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 flex justify-center items-center flex-col mb-28">
                <div className="flex flex-col items-center gap-2">
                    <XCircle className="h-8 w-8 text-red-500"/>
                    <h3 className="font-semibold text-xl">
                        Too many pages in PDF.
                    </h3>
                    <p className="text-zinc-500 text-sm">
                        Your <span className="font-medium">Free</span> plan supports upto 5 pages per PDF.
                    </p>
                    <Link href='/dashboard' className={buttonVariants({
                        variant: 'secondary',
                        className: "mt-4"
                    })}>
                    <ChevronLeft className="h-3 w-3 mr-1.5"/> Back
                    </Link>
                </div>
            </div>

            <ChatInput isDisabled/>
        </div>
    )

    // Main return function is below
    return (
        <ChatContextProvider fileId={fileId}>
        <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
            <div className="flex-1 justify-between flex flex-col mb-28">
                {/* Messages in the chat section -- in chat folder under component */}
                <Messages fileId={fileId}/>
            </div>

            {/* chat input -- user types and send message */}
            {/* Chat section contains many things so creating a folder for it in components */}
            <ChatInput isDisabled/> 

        </div>
        </ChatContextProvider>
    )
}

export default ChatWrapper