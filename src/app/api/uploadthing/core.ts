import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: '4MB' } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession()
      const user = await getUser()

      if (!user || !user.id) throw new Error("UNAUTHORIZED")

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {  // upload files in the database and metadata in the supabase database
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId, 
          // url: file.url  -->> we aren't using this as this may give session time out error some times
          // so we are using the file.url from the amazon s3 server from the uploadthing
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
          // url: file.url,
          uploadStatus: "PROCESSING",
        },
      })
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

