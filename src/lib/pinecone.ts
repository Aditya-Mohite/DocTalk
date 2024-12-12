// Making a seperate file to store in the pinecone database

// import { PineconeClient } from '@pinecone-database/pinecone'

// export const getPineconeClient = async () => {
//   const client = new PineconeClient()

//   await client.init({
//     apiKey: process.env.PINECONE_API_KEY!,
//     environment: 'us-east1-aws',
//   })

//   return client
// }

// import { Pinecone } from '@pinecone-database/pinecone';

// export const pinecone = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY as string,
// });
// export const pineconeIndex = pc.index('quickstart');

import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);