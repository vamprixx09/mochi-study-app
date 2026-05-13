import { Type } from "@google/genai";
import { StudyPlan } from "../types";

async function callMochiAI(model: string, contents: any, config?: any) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents, config })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Mochi is feeling a bit tired. 🍡" }));
    throw new Error(errorData.error || "Mochi is having trouble right now. 🍡");
  }

  return await response.json();
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
  If given audio, listen to it carefully and respond warmly.
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

  try {
    const response = await callMochiAI(model, contents, { systemInstruction });
    const fullText = response.text || "";
    onChunk(fullText);
    return fullText;
  } catch (error: any) {
    console.error("Gemini Content Generation Failed:", error);
    throw error;
  }
}

export async function generateStudyPlan(subject: string, examDate: string, availableHours: number): Promise<Partial<StudyPlan>> {
  const model = "gemini-3-flash-preview";
  const prompt = `Create a study plan for the subject: ${subject}. 
  The exam date is ${examDate}. I have ${availableHours} hours total to study.
  Provide a JSON response with:
  - summary: a short encouraging summary
  - days: an array of daily tasks with 'day' (number), 'focus' (topic), 'tasks' (array of strings), 'minutes' (number)
  - tips: an array of 3-5 study tips.`;

  const response = await callMochiAI(model, prompt, {
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
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              minutes: { type: Type.INTEGER }
            },
            required: ["day", "focus", "tasks", "minutes"]
          }
        },
        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["summary", "days", "tips"]
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateFlashcards(textOrTopic: string): Promise<{ front: string, back: string }[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate 5-10 high-quality study flashcards based on this topic or text: "${textOrTopic}".
  Return a JSON array of objects with 'front' (question/term) and 'back' (answer/definition).`;

  const response = await callMochiAI(model, prompt, {
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
  });

  return JSON.parse(response.text || "[]");
}

export async function generateMochiImage(prompt: string, imageBase64?: string): Promise<string> {
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
    text: `Generate a high-quality illustration. Subject: ${prompt}. Style: Acubi aesthetic, soft dreamy pastels, cute characters. Output ONLY the image.`
  });

  const response = await callMochiAI(model, { parts });

  // Find the image part in the response
  for (const part of (response as any).candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated by Mochi! 🍡");
}

export async function generateExamPrep(subject: string): Promise<any> {
  const model = "gemini-3-flash-preview";
  const prompt = `Create a 7-day exam preparation plan for: ${subject}. Return JSON.`;

  const response = await callMochiAI(model, prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        schedule: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, tasks: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
        breakdown: { type: Type.STRING },
        quiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } } } },
        resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        motivation: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateNotes(topic: string): Promise<string> {
  const response = await callMochiAI("gemini-3-flash-preview", `Write structured study notes for: ${topic}. Use Markdown.`);
  return response.text || "";
}
