// Creating a utility page to get a response from openai LLM model
// we can directly import and use this utilty instead of writing whole code everytime

import OpenAI from "openai";

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})