import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai"
import { PineconeStore } from "@langchain/pinecone"
import { Pinecone } from "@pinecone-database/pinecone";
import { pinecone } from "@/lib/pinecone";
// import { getPineconeClient, pinecone } from "@/lib/pinecone";
import { pineconeIndex } from "@/lib/pinecone";



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

      // Whatever is returned here is accessible in 'onUploadComplete' as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {  // upload files in the database and metadata of the pdf in supabase database
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          // url: file.url  -->> we aren't using this as this may give session time out error some times
          // so we are using the file.url from the amazon s3 server from the uploadthing
          // url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
          url: `https://utfs.io/f/${file.key}`,
          // url: file.key,
          uploadStatus: "PROCESSING",
        },
      });

      // Below is for embedding openAI and vector database
      // making a new file to upload in the pinecone database as a vector
      try {
        const response = await fetch(`https://utfs.io/f/${file.key}`)

        // make a pdf as a BLOB(Binary Large Object)
        const blob = await response.blob()

        const loader = new PDFLoader(blob)
        // Access pages of pdf
        const pageLevelDocs = await loader.load()
        // amount of pages
        const pageAmt = pageLevelDocs.length

        // Vectorize and index the entire document
        // const pinecone = await getPineconeClient()  // call this from 'lib'
        // const pineconeIndex = pinecone.Index("doctalk")

        // Generate vector from text
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY   // open ai api 
        })

        // const embeddings = new GoogleGenerativeAIEmbeddings({
        //   apiKey: process.env.GOOGLE_API_KEY!,
        // });

        console.log("loaded documents: ", pageLevelDocs);

        // convert text to vector
        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: createdFile.id,
        })

        // update status
        await db.file.update({
          data: { uploadStatus: "SUCCESS" },
          where: { id: createdFile.id },
        });
      } catch (err) {
        console.error(err);
        await db.file.update({
          data: { uploadStatus: "FAILED" },
          where: { id: createdFile.id },
        })
      }

      // update status
      await db.file.update({
        where: { id: createdFile.id },
        data: { uploadStatus: "COMPLETED" },
      });

    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

