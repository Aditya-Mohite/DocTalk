"use client" // client side content so using this to make it client side component
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { trpc } from "@/app/_trpc/client"
import { PropsWithChildren, useState } from "react"

  

const Providers = ({children}: PropsWithChildren) => {
    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() => 
        trpc.createClient({
            // Links is an array
            links: [httpBatchLink({url: 'http://localhost:3000/api/trpc',})],
        })
    )

    return (
        // making trpc component that we can use in whole project 
        <trpc.Provider client = {trpcClient} queryClient={queryClient}>
            <QueryClientProvider client = {queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    )
}

export default Providers