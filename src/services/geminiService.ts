import { GoogleGenAI, Type } from "@google/genai";
import { StudyPlan } from "../types";

// AI Studio automatically injects GEMINI_API_KEY secret into process.env at runtime via vite-define
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

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
  
  MULTILINGUAL MODE:
  - You are fluent in English, Urdu, Hindi, Japanese, Korean, Chinese, Arabic, French, Spanish, and more.
  - Automatically detect the user's language and respond in the same language.
  - If the user switches languages, you switch too.
  
  If given an image, you can perform OCR to extract text and explain it helpfully.
  If given audio, listen to it carefully and respond warmly.
  You like to encourage students and make learning feel stress-free.`;

  const ai = getAI();
  
  const contents: any[] = history.map(h => ({
    role: h.role,
    parts: h.parts.map(p => ({ text: p.text }))
  }));

  const userParts: any[] = [{ text: message || "Listen to this audio/image! 🎀" }];
  
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
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config: { systemInstruction }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(text);
    }
    return fullText;
  } catch (error: any) {
    console.error("Gemini chatWithMochiStream Failed:", error);
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}

export async function generateStudyPlan(subject: string, examDate: string, availableHours: number): Promise<Partial<StudyPlan>> {
  const model = "gemini-3-flash-preview"; 
  const prompt = `Create a study plan for the subject: ${subject}. 
  The exam date is ${examDate}. I have ${availableHours} hours total to study.
  Provide a JSON response matching the requested schema.`;

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
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
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    return {};
  }
}

export async function generateFlashcards(textOrTopic: string): Promise<{ front: string, back: string }[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate 5-10 high-quality study flashcards based on this topic or text: "${textOrTopic}".
  Return a JSON array of objects with 'front' (question/term) and 'back' (answer/definition).`;

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
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

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    return [];
  }
}

export async function generateMochiImage(prompt: string, imageBase64?: string): Promise<string> {
  const model = "gemini-2.5-flash-image";
  const ai = getAI();
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

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated by Mochi! 🍡");
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}

export async function generateExamPrep(subject: string): Promise<any> {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Create a 7-day exam preparation plan for: ${subject}. Return JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    return {};
  }
}

export async function generatePDFContent(topic: string): Promise<any> {
    const model = "gemini-3.1-pro-preview"; 
    const prompt = `Create comprehensive, academic but aesthetic study notes for the topic: "${topic}".
    Be extremely thorough. Include multiple sections, key takeaways, and a glossary of terms.
    The goal is to create a high-quality revision PDF.`;
    
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    
      return JSON.parse(response.text || "{}");
    } catch (error: any) {
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
        throw new Error("API_KEY_INVALID");
      }
      throw new Error("Mochi had trouble formatting your study notes. 🍡");
    }
}

export async function chatWithLanguageTutor(
    language: string,
    mode: 'beginner' | 'intermediate' | 'advanced',
    messages: { role: 'user' | 'model', content: string }[]
) {
    const model = "gemini-3-flash-preview"; 
    const systemInstruction = `You are "Mochi Tutu", a friendly, patient, and kawaii language learning friend. 
    The user is learning ${language} at a ${mode} level.
    
    CRITICAL BEHAVIOR:
    - ALWAYS EXPLAIN IN ENGLISH. You are teaching a beginner. 
    - The conversation should be mostly in English so the student understands everything.
    - Only use ${language} for examples, phrases, and translations you are teaching.
    - If the user asks how to say something, give them the word in ${language}, the pronunciation, and the meaning in English.
    
    Structure your teaching responses like this:
    "Explanation/Answer in English... 🌸"
    
    🌸 [Target Language Phrase/Word]
    [Romanization/Pronunciation]
    
    💭 Meaning:
    [English Meaning]
    
    ✨ Example:
    [Example sentence in ${language}]
    ([English Translation])
    
    Correction (if the user made a mistake):
    "English explanation of mistake... 🍡"
    
    Supported: Japanese, Korean, Chinese, Spanish, French, Arabic, English, Urdu.
    Vibe: Supportive, Acubi aesthetic, simple explanations.`;

    const ai = getAI();
    const contents: any[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction }
      });
      return response.text || "";
    } catch (error: any) {
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
}

export async function generateNotes(topic: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Write structured study notes for: ${topic}. Use Markdown.`
    });
    return response.text || "";
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}

export async function generateDailyRoutine(goals: string[], currentRoutine?: any): Promise<any> {
    const model = "gemini-3-flash-preview";
    const ai = getAI();
    const prompt = `Generate a perfect daily study routine for a student with these goals: ${goals.join(', ')}.
    ${currentRoutine ? `Current routine context: ${JSON.stringify(currentRoutine)}` : ''}
    Return a JSON object with:
    - wakeUpTime: "HH:mm"
    - blocks: array of { title, startTime, duration (mins), type (study/break/revision/quiz/rest/personal), subject? }
    
    Balance the day with Pomodoro-style breaks, revision segments, and focus blocks.
    Vibe: Kawaii, productive, balanced.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wakeUpTime: { type: Type.STRING },
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    type: { type: Type.STRING, enum: ['study', 'break', 'revision', 'quiz', 'rest', 'personal'] },
                    subject: { type: Type.STRING }
                  },
                  required: ["title", "startTime", "duration", "type"]
                }
              }
            },
            required: ["wakeUpTime", "blocks"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error: any) {
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('403') || error.message?.includes('401')) {
          throw new Error("API_KEY_INVALID");
        }
        return null;
    }
}
