import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse } from '../AIProvider';
import { env } from '../../config/env';

export class GoogleProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    if (!env.AI_API_KEY) {
      throw new Error('AI_API_KEY is missing');
    }
    this.genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    this.modelName = env.AI_MODEL || 'gemini-2.5-flash';
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: request.systemPrompt,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.2,
          responseMimeType: 'application/json',
        }
      });

      const responseText = result.response.text();
      return { content: responseText };
    } catch (error) {
      console.error('GoogleProvider Error:', error);
      throw error;
    }
  }
}
