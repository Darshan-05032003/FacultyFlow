import api from '../../../lib/api';

export interface AIResponse {
  isFallback: boolean;
  answer: string;
  keyFactors: string[];
  suggestedActions: string[];
  disclaimer?: string;
}

export const askAssistant = async (message: string): Promise<AIResponse> => {
  const response = await api.post('/ai/assistant', { message });
  return (response as any).data;
};
