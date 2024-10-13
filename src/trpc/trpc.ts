import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";

const t = initTRPC.create();


// defining middleware 
// this is only to see the pdfs the user have on the dashboard page
// this is visible to only logged in users that's why we are not using publicProcedure call
// we are defining our own endpoint
const middleware = t.middleware

const isAuth = middleware(async (options) => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    // If user is not logged in
    if (!user || !user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    return options.next({
        // this context allows to pass any value in the api route
        ctx: {
            userId: user.id,
            user,
        },
    })
})

export const router = t.router;
export const publicProcedure = t.procedure;

// If we call 'privateProcedure' then this customised endpoint will be called 
export const privateProcedure = t.procedure.use(isAuth)

// "publicProcedure" allows us to create an api regardless of it is authenticated or not