import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate poster design suggestions
export const generatePosterSuggestions = asyncHandler(async (req, res) => {
    const { eventTitle, eventDescription, eventType, theme } = req.body;

    if (!eventTitle || !eventDescription) {
        throw new ApiError(400, "Event title and description are required");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate creative poster design suggestions for an event with the following details:
        Title: ${eventTitle}
        Description: ${eventDescription}
        Type: ${eventType || 'General'}
        Theme: ${theme || 'Professional'}
        
        Provide:
        1. Color scheme suggestions (3-4 colors with hex codes)
        2. Typography recommendations
        3. Layout suggestions
        4. Key visual elements to include
        5. Text hierarchy and placement
        
        Format the response as JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res
            .status(200)
            .json(new ApiResponse(200, { suggestions: text }, "Poster suggestions generated successfully"));
    } catch (error) {
        console.error("Error generating poster suggestions:", error);
        throw new ApiError(500, "Failed to generate poster suggestions");
    }
});

// Generate poster tagline
export const generateTagline = asyncHandler(async (req, res) => {
    const { eventTitle, eventDescription } = req.body;

    if (!eventTitle || !eventDescription) {
        throw new ApiError(400, "Event title and description are required");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate 5 creative and catchy taglines for an event:
        Title: ${eventTitle}
        Description: ${eventDescription}
        
        Provide short, memorable taglines that capture the essence of the event.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res
            .status(200)
            .json(new ApiResponse(200, { taglines: text }, "Taglines generated successfully"));
    } catch (error) {
        console.error("Error generating taglines:", error);
        throw new ApiError(500, "Failed to generate taglines");
    }
});
