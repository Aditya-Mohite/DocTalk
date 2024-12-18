// This Page is made using dynamic route
// This page will show the pdf when we open it from dashboard
// PDF will be fetched from the database using the file id 
// this is having the pdf view and chat sections

import ChatWrapper from "@/components/chat/ChatWrapper"
import PdfRender from "@/components/PdfRender"
import { db } from "@/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { notFound, redirect } from "next/navigation"


interface PageProps {
    params: {
        fileid: string
    }
}

const Page = async ({params}: PageProps) => {
    // retrieve the file id
    const {fileid} = params 

    // make sure that user is logged in
    const {getUser} = getKindeServerSession()
    const user = await getUser()

    if(!user || !user.id){
        redirect(`auth-callback?origin=dashboard/${fileid}`)
    }

    ///// <<<<<<<------  make database call    ------>>>>>>   ////////
    const file = await db.file.findFirst({
        where: {
            id: fileid,
            userId: user.id,
        },
    })
    // console.log(user.id)
    // console.log(fileid)

    // const baseurl = `https://utfs.io/f/${file.key}`

    console.log(file);

    if(!file || !file.url){
        console.error('File not found or URL missing', { fileid, userId: user.id });
        notFound()
    } 

    return (
        <div className="flex-1 justify-between flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
                
                {/* Left side PDF view */}
                <div className="flex-1 xl:flex">
                    <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
                        {/* New component for pdf rendering */}
                        {/* take reference of the PdfRender.tsx page */}
                        {/* we passed file url to renderer to render pdf */}
                        <PdfRender url={file.url} />  
                    </div>
                </div>

                {/* Right hand side chat window  */}
                <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
                    {/* new chat wrapper component */}
                    <ChatWrapper fileId={file.id}/>
                </div>

            </div>
        </div>
    )
}

export default Page