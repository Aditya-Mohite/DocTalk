import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

export const appRouter = router({
    // publicProcedure.query  -->> used for a GET method
    // publicProcedure.mutation  -->> used for a POST, DELETE method
    authCallback: publicProcedure.query(async () => {  // GET request to check if user is in database or not
        // get user from the Kinde
        // mkaes sure that user has logged in
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        // If user not found
        if (!user.id || !user.email) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        // if user is in the database ans logged in
        // Finding user in the database  
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id
            }
        })

        // If user not in the database then create new user in the database
        if (!dbUser) {
            // Creating new user in the database
            await db.user.create({
                data: {
                    // Left hand id is from database and right side is from Kinde database
                    id: user.id,
                    email: user.email
                }
            })
        }

        return { success: true }
    }),

    // Pass user id and get the all files that user have
    // privateProcedure call is only accessible for the logged in users
    getUserFiles: privateProcedure.query(async ({ ctx }) => {
        // Destructure the 'ctx' from the privateProcedure that we have created in the trpc.ts file
        const { userId } = ctx

        return await db.file.findMany({
            where: {
                userId
            }
        })
    }),

    // Get file information -- i.e. whether file is uploaded and it is in the database or not
    getFile: privateProcedure.input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx

            // check the file is in the database (in uploadthing database)
            const file = await db.file.findFirst({
                where: {
                    key: input.key,
                    userId,
                },
            })
            // if file is not in the database
            if (!file) throw new TRPCError({ code: "NOT_FOUND" })

            return file
        }),

    // Delete any file routes --->>
    deleteFile: privateProcedure.input(
        z.object({ id: z.string() })
    ).mutation(async ({ ctx, input }) => {
        const { userId } = ctx  // storing the data that is collected from ctx procedure call 
        // if (!userId) {
        //     throw new TRPCError({ code: "UNAUTHORIZED" });
        // }
        const file = await db.file.findFirst({
            where: {
                id: input.id,
                userId,
            },
        })
        if (!file) {
            throw new TRPCError({ code: "NOT_FOUND" })
        }

        await db.file.delete({
            where: {
                id: input.id,
            },
        })
        return file
    }),


    // Get file upload status 
    getFileUploadStatus: privateProcedure.input(
        z.object({ fileId: z.string() })).query(async ({ ctx, input }) => {
            // find file in db and get its status
            const file = await db.file.findFirst({
                where: {
                    id: input.fileId,
                    userId: ctx.userId,
                },
            })

            if (!file) {
                return { status: "PENDING" as const }
            }
            // if file is in db, return its status
            return { status: file.uploadStatus }
        }),


    // Get messages from the database creating endpoint to fetch messages
    getFileMessages: privateProcedure.input(
        z.object({
            limit: z.number().min(1).max(100).nullish(),
            cursor: z.string().nullish(),
            fileId: z.string()
        })
    ).query(async ({ctx, input}) => {
        const {userId} = ctx
        const {fileId, cursor} = input
        const limit = input.limit ?? INFINITE_QUERY_LIMIT

        // ensure that user can see only his own files
        const file = await db.file.findFirst({
            where: {
                id: fileId,
                userId
            }
        })
        if(!file) throw new TRPCError({code: "NOT_FOUND"})

        //Fetch messages from database
        const messages = await db.message.findMany({
            take: limit + 1,
            where: {
                fileId
            },
            orderBy: {
                createdAt: "desc"
            },
            cursor: cursor ? {id: cursor} : undefined,
            select: {
                id: true,
                isUserMessage: true,
                createdAt: true,
                text: true,
            }
        })

        // when we scroll up then determine the next cursor
        let nextCursor: typeof cursor | undefined = undefined
        if(messages.length > limit) {
            const nextItem = messages.pop()
            nextCursor = nextItem?.id
        }

        return {
            messages, nextCursor
        }
    }),

    // Endpoint for the Stripe session for payment gateway
    createStripeSession: privateProcedure.mutation(async ({ctx}) => {
        const {userId} = ctx

        const billingUrl = absoluteUrl("/dashboard/billing")

        if(!userId) throw new TRPCError({code: "UNAUTHORIZED"})
            
        const dbUser = await db.user.findFirst({
            where: {
                id: userId,
            },
        })

        if(!dbUser) throw new TRPCError({code: "UNAUTHORIZED"})

        // check if user is already subscribed or not
        const subscriptionPlan = await getUserSubscriptionPlan()

        if(subscriptionPlan.isSubscribed && dbUser.stripeCustomerId){
            // Manage the subscription plan
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: dbUser.stripeCustomerId,
                return_url: billingUrl,
            })

            return {url: stripeSession.url}
        }

        // If not subscribed then navigate user to that page
        const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ["card", "paypal"],
            mode: "subscription",
            billing_address_collection: "auto",
            line_items: [
                {
                    price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
            },
        })
        return {url: stripeSession.url}
    }),

})


// type of data that is being fetched from backend -> 
export type appRouter = typeof appRouter