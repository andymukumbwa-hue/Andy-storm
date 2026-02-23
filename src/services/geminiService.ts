import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ArtisticStyle = 'watercolor' | 'oil' | 'charcoal' | 'cyberpunk' | 'pencil' | 'popart';

const STYLE_PROMPTS: Record<ArtisticStyle, string> = {
  watercolor: 'Transform this image into a vibrant watercolor splash effect sketch. The style should be artistic, with visible brush strokes, paint drips, and a beautiful blend of colors, while maintaining the core subject of the original photo.',
  oil: 'Transform this image into a classic oil painting. Use thick, visible brush strokes, rich textures, and deep, vibrant colors. The final result should look like a masterpiece on canvas.',
  charcoal: 'Transform this image into a rough charcoal sketch. Use black and white tones, expressive hand-drawn lines, and smudged shading to create a dramatic, artistic feel.',
  cyberpunk: 'Transform this image into a neon cyberpunk style. Use high contrast, glowing edges, and a palette dominated by electric pink, blue, and purple. Add a futuristic, digital glitch aesthetic.',
  pencil: 'Transform this image into a detailed pencil drawing. Use fine graphite lines, realistic shading, and cross-hatching to create a classic, hand-sketched look on paper.',
  popart: 'Transform this image into a bold pop art style. Use vibrant, flat colors, thick outlines, and halftone dot patterns reminiscent of 1960s comic book art.'
};

export async function transformToArtisticStyle(base64Image: string, mimeType: string, style: ArtisticStyle): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: STYLE_PROMPTS[style],
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error transforming image:", error);
    throw error;
  }
}

export async function swapOutfit(base64Image: string, mimeType: string, outfitDescription: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Please swap the outfit of the person in this image with the following description: ${outfitDescription}. Keep the person's identity, pose, and background as consistent as possible. Only change the clothing.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error swapping outfit:", error);
    throw error;
  }
}
