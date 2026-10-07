import axios from 'axios';

export interface AIResponse {
  isFallback: boolean;
  answer: string;
  keyFactors: string[];
  suggestedActions: string[];
  disclaimer?: string;
}

export const askAssistant = async (message: string): Promise<AIResponse> => {
  const response = await axios.post('/api/v1/ai/assistant', { message });
  return response.data.data;
};
