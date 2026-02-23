import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    return genAI.getGenerativeModel({ model: modelName });
};

export async function verifyScoreWithAI(imageUrl: string, expectedScore: number, expectedName: string) {
    try {
        const model = getGeminiModel();

        // Fetch the image
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const prompt = `You are verifying a video game leaderboard score. 
Extract the main numeric score value and any handwritten name/text from this image.
The handwritten text is usually on a piece of paper next to the screen.

Target Player Name: "${expectedName}"
Target Score: ${expectedScore}

Return ONLY a valid JSON object in this exact format:
{
  "detectedScore": 12345,
  "detectedName": "username",
  "confidence": 0.95,
  "matchScore": true,
  "matchName": true,
  "reasoning": "Brief explanation"
}

Notes:
- detectedScore: The raw number found on the screen.
- detectedName: The text found on the handwritten note.
- matchScore: True if detectedScore matches ${expectedScore}.
- matchName: True if detectedName fuzzily matches "${expectedName}".
- confidence: Your confidence in the detection (0-1).

Do not include markdown formatting or backticks, just raw JSON.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: response.headers.get("content-type") || "image/jpeg",
                },
            },
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error(`Failed to parse Gemini output: ${text}`);
        }
    } catch (error) {
        console.error("Gemini Verification Error:", error);
        throw error;
    }
}
