import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";

export const appRouter = router({
    // publicProcedure.query  -->> used for a GET method
    // publicProcedure.mutation  -->> used for a POST, DELETE method
    authCallback: publicProcedure.query(async () => {  // GET request to check if user is in database or not
        // get user from the Kinde
        // mkaes sure that user has logged in
        const {getUser} = getKindeServerSession();
        const user = await getUser();

        // If user not found
        if(!user.id || !user.email)
        {
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
        if(!dbUser)
        {
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
    getUserFiles: privateProcedure.query(async ({ctx}) => {
        // Destructure the 'ctx' from the privateProcedure that we have created in the trpc.ts file
        const { userId } = ctx

        return await db.file.findMany({
            where: {
                userId
            }
        })
    }),

    // Get file information -- i.e. whether file is uploaded and it is in the database or not
    getFile: privateProcedure.input(z.object({key: z.string()}))
    .mutation(async ({ctx, input}) => {
        const {userId} = ctx

        // check the file is in the database (in uploadthing database)
        const file = await db.file.findFirst({
            where: {
                key: input.key,
                userId,
            },
        })
        // if file is not in the database
        if(!file) throw new TRPCError({code: "NOT_FOUND"})

        return file
    }),

    // Delete any file routes --->>
    deleteFile: privateProcedure.input(
        z.object({id: z.string()})
    ).mutation(async ({ctx, input}) => {
        const {userId} = ctx  // storing the data that is collected from ctx procedure call 
        // if (!userId) {
        //     throw new TRPCError({ code: "UNAUTHORIZED" });
        // }

        const file = await db.file.findFirst({
            where: {
                id: input.id,
                userId,
            },
        })
        if(!file){
            throw new TRPCError({code: "NOT_FOUND"})
        }

        await db.file.delete({
            where: {
                id: input.id,
            },
        })
        return file
    }),
})


// type of data that is being fetched from backend -> 
export type appRouter = typeof appRouter