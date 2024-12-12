// This is the endpoint for the messages and questions

import { db } from "@/db";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai"
import { PineconeStore } from "@langchain/pinecone";
import { pineconeIndex } from "@/lib/pinecone";
import { openai } from "@/lib/openai";
import { OpenAIStream, StreamingTextResponse } from "ai"

export const POST = async (req: NextRequest) => {
    // endpoint for asking a question to a PDF file

    // access to body of message that we declared in the post method
    const body = await req.json()

    // check if user is authenticated
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    const { id: userId } = user

    if (!userId) {
        return new Response('Unauthorized', { status: 401 })
    }

    // Parse the body of message using the validator from 'lib'
    const { fileId, message } = SendMessageValidator.parse(body)

    // find the file from database
    // we only looking for the files that the logged in user has
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId,
        },
    })

    if (!file) {
        return new Response('Not found', { status: 404 })
    }

    // Creating a question 
    // create a new message in the database (add the sent messages in database)
    await db.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId,
        },
    })

    // Creating answer of question
    // Determine that which page of pdf has the similar context to question

    // 1. Vectorize the input message from user
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY   // open ai api 
    })

    // search for a relavant page for a input messsage in vector database
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: file.id
    })

    // Get result from pinecone database
    const results = await vectorStore.similaritySearch(message, 4)  // search similar with "input message" and give 4 closest results

    // Get previous messages from dastabase history
    const prevMessages = await db.message.findMany({
        where: {
            fileId
        },
        orderBy: {
            createdAt: "asc"  // order by ascending order
        },
        take: 6   // take last 6 messages to show
    })

    // Send messages to the openai to answer the question
    const formattedPrevMessages = prevMessages.map((msg) => ({
        role: msg.isUserMessage ? "user" as const : "assistant" as const,
        content: msg.text
    }))

    // Get respnse from the openai
    // Also showing some previous messages 
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        stream: true,
        messages: [
            {
                role: 'system',
                content:
                    'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
            },
            {
                role: 'user',
                content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
              
        \n----------------\n
        
        PREVIOUS CONVERSATION:
        ${formattedPrevMessages.map((message) => {
                    if (message.role === 'user') return `User: ${message.content}\n`
                    return `Assistant: ${message.content}\n`
                })}
        
        \n----------------\n
        
        CONTEXT:
        ${results.map((r) => r.pageContent).join('\n\n')}
        
        USER INPUT: ${message}`,
            },
        ],
    })

    // Stream real time messages from AI on the screen
    const stream = OpenAIStream(response, {
        async onCompletion(completion) {   // save a complete message in database
            await db.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    fileId,
                    userId,
                },
            })
        },
    })

    return new StreamingTextResponse(stream)
}