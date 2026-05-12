import { GoogleGenAI, Type } from "@google/genai";
import { StudyPlan } from "../types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === '') {
      throw new Error(`Gemini API key is missing! 🎀
      
1. Open the [Settings] menu in the top right.
2. Select [Secrets].
3. Add a secret named [GEMINI_API_KEY] with your key.
4. Refresh the page or click 'Retry' in the preview. ✨`);
    }
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

export async function chatWithMochiStream(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  onChunk: (text: string) => void,
  imageBase64?: string,
  audioBase64?: string
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are Mochi, a gentle, encouraging, and highly intelligent study companion. 
  Your vibe is Acubi kawaii / soft Y2K. Use cute emojis like 🎀, 🍡, ✨, 🫧, ☁️, 🌸, 🩵, 🩷, 🐰.
  You are never harsh, always supportive, and use simple, clear language. 
  If given an image, you can perform OCR to extract text and explain it helpfully.
  If given audio, listen to it carefully and respond warmly as a voice message would.
  You like to encourage students and make learning feel stress-free.`;

  const contents: any[] = history.map(h => ({
    role: h.role,
    parts: h.parts
  }));

  const userParts: any[] = [{ text: message || "Listen to this audio message! 🎀" }];
  
  if (imageBase64) {
    userParts.push({
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: imageBase64.match(/data:([^;]+);/)?.[1] || "image/jpeg"
      }
    });
  }

  if (audioBase64) {
    userParts.push({
      inlineData: {
        data: audioBase64.split(',')[1] || audioBase64,
        mimeType: audioBase64.match(/data:([^;]+);/)?.[1] || "audio/webm"
      }
    });
  }

  contents.push({ role: 'user', parts: userParts });

  const stream = await getAI().models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction,
    }
  });

  let fullText = "";
  for await (const chunk of stream) {
    const chunkText = chunk.text || "";
    fullText += chunkText;
    onChunk(fullText);
  }

  return fullText;
}

export async function generateStudyPlan(subject: string, examDate: string, availableHours: number): Promise<Partial<StudyPlan>> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Create a study plan for the subject: ${subject}. 
  The exam date is ${examDate}. I have ${availableHours} hours total to study.
  Provide a JSON response with:
  - summary: a short encouraging summary
  - days: an array of daily tasks with 'day' (number), 'focus' (topic), 'tasks' (array of strings), 'minutes' (number)
  - tips: an array of 3-5 study tips.`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                focus: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                minutes: { type: Type.INTEGER }
              }
            }
          },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateFlashcards(textOrTopic: string): Promise<{ front: string, back: string }[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Generate 5-10 high-quality study flashcards based on this topic or text: "${textOrTopic}".
  Return a JSON array of objects with 'front' (question/term) and 'back' (answer/definition).`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateMochiImage(prompt: string, imageBase64?: string): Promise<string> {
  // Using the general image generation model
  const model = "gemini-2.5-flash-image";
  
  const parts: any[] = [];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: imageBase64.match(/data:([^;]+);/)?.[1] || "image/jpeg"
      }
    });
  }
  
  parts.push({
    text: `Generate a high-quality kawaii illustration. 
    Subject: ${prompt}. 
    Style: Acubi aesthetic, soft dreamy pastels, cute characters, Mochi mascots, sparkles, ribbons. 
    ${imageBase64 ? "Incorporate elements or style from the provided image." : ""}
    Output only the generated image.`
  });

  try {
  const response = await getAI().models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("No response candidates found from AI.");
    }

    // Iterate through parts to find the image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("AI did not return an image part.");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
}

export async function generateExamPrep(subject: string): Promise<any> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Create a 7-day exam preparation plan for: ${subject}. 
  Include:
  - schedule: Array of { day: string, tasks: string[] } for 7 days.
  - breakdown: String explaining key topics to focus on.
  - quiz: Array of 3-5 multiple choice questions related to the topic.
  - resources: Array of recommended resources.
  - motivation: A cute motivational message for exam season.
  Return JSON.`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          breakdown: { type: Type.STRING },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING }
              }
            }
          },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          motivation: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateNotes(topic: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const response = await getAI().models.generateContent({
    model,
    contents: `Write structured, easy-to-read study notes for the topic: ${topic}. 
    Use bullet points, bold terms, and a friendly tone. Use Markdown.`,
  });

  return response.text;
}
