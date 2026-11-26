 import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "API key is missing in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "No messages received" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // Convert chat messages into one text prompt
    const conversation = messages
      .map((message) => {
        const role =
          message.sender === "user" ? "User" : "Assistant";

        return role + ": " + String(message.text);
      })
      .join("\n\n");

    // Call Gemini Interactions API
    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input: conversation,
      system_instruction:
        "You are a helpful AI assistant. Answer clearly and accurately."
    });

    const reply = interaction.output_text;

    if (!reply) {
      throw new Error("Gemini returned an empty response.");
    }

    return Response.json({
      reply: reply
    });

  } catch (error) {
    console.error("Gemini API Error:", error);

    return Response.json(
      {
        error: error.message || "Something went wrong."
      },
      {
        status: Number(error.status || error.code) || 500
      }
    );
  }
}