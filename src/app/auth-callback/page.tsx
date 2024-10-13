// This page redirect to the dashboard to the logged in users
// It will show the redirecting loader animation

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { trpc } from "../_trpc/client";
import { Loader2 } from "lucide-react";


const Page = () => {
    const router = useRouter()  // To redirect the user to the dashboard

    const searchParams = useSearchParams();  //parameters from the api
    const origin = searchParams.get('origin');  // get origin for this -> "/auth-callback?origin=dashboard"


    // we can see the 'authCallback' endpoint that we have created
    // we are using 'useQuery' because we have used publicProcedure.query to initialize test
    // ... if it was publicProcedure.mutation the n we need to use 'useMutation'
    const query = trpc.authCallback.useQuery(undefined, {
        retry: true,
        retryDelay: 500,
    });

    // Check for errors in the query result
    if (query.error) {
        const errData = query.error.data;
        if (errData?.code === 'UNAUTHORIZED') 
        {
            // redirect to login page if user is unauthorized
            router.push('/sign-in');
        } 
        else 
        {
            // Handle other types of errors
            console.error("An error occurred:", query.error);
        }
    }

    // Continue with other logic based on the query result
    if (query.data?.success) {
        router.push(origin ? `/${origin}` : '/dashboard');
    }

    return (
        <div className="w-full mt-24 flex justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
                <h3 className="font-semibold text-xl">Setting up your account...</h3>
                <p>You will be redirected automatically.</p>
            </div>
        </div>
    )

}

export default Page