import Dashboard from "@/components/Dashboard";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser(); // Await the promise directly in the async component

    // check if user is logged in 
    if (!user || !user.id) {
        redirect('/auth-callback?origin=dashboard')
    }

    // If user is synced to the database then -->>
    const dbUser = await db.user.findFirst({
        where: {
            id: user.id,
        }
    })

    // If user is not synced to the database then-->>
    // send the user to the auth-callback
    if(!dbUser) {
        redirect('/auth-callback?origin=dashboard')
    }


    return (
        <Dashboard />
    );
};

export default Page;
