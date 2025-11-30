import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `You are an expert paleographer, cryptographer, and art historian specializing in ancient, obscure, and encrypted manuscripts (such as the Voynich Manuscript, Codex Seraphinianus, or medieval alchemy texts).

Your goal is to analyze images with high precision, balancing academic rigor with creative interpretation where facts are missing.

Always format your response using Markdown. Use bolding for key terms.`;

/**
 * Converts a base64 data URL to the raw base64 string required by Gemini
 */
const cleanBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

/**
 * Streams the analysis of a manuscript image
 */
export const streamManuscriptAnalysis = async (
  imageDataUrl: string,
  promptOverride?: string
): Promise<AsyncGenerator<string, void, unknown>> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const base64Data = cleanBase64(imageDataUrl);
  const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));

  const analysisTask = `
    Analyze the provided image with high precision.
    
    Structure your analysis into these sections:
    
    1. **Identification & Overview**: Identify the manuscript if possible (e.g., "This appears to be Folio 78r from the Voynich Manuscript"). If unknown, describe its likely era and origin style.
    2. **Visual Analysis**: Describe the illustrations in detail. What are the figures doing? What do the colors (green, blue, red) signify? Note any botanical, astronomical, or anatomical features.
    3. **Script Analysis**: Analyze the writing system. Is it a known language, a cipher, or an invented script (like "Voynichese")? Describe the glyph shapes.
    4. **Decipherment Attempt**: 
       - If it is a known language, provide a translation.
       - If it is an undeciphered text (like Voynich), provide a "best guess" thematic interpretation based on current academic theories (e.g., herbal medicine, balneology/baths, astrology).
       - *Creative Decoding*: Create a plausible, poetic interpretation of what this specific page might be saying about the scene depicted.
    
    Be thorough, academic yet accessible, and imaginative where facts are missing.
  `;

  const finalPrompt = promptOverride || analysisTask;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // Create a generator that yields text chunks
    async function* generate() {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }

    return generate();

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze the manuscript.");
  }
};

/**
 * Chat with the document context (Streaming)
 */
export const streamChatWithManuscript = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentMessage: string,
  imageDataUrl: string
): Promise<AsyncGenerator<string, void, unknown>> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
    
  const base64Data = cleanBase64(imageDataUrl);
  const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));
    
  // Transform history for the API prompt context
  const prompt = `
    Context of conversation:
    ${history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}
    
    USER QUESTION: ${currentMessage}
    
    Answer the user's question based on the image provided and the context above.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                { text: prompt }
            ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
    });

    async function* generate() {
        for await (const chunk of responseStream) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    }

    return generate();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    throw new Error(error.message || "Failed to chat with the manuscript.");
  }
};