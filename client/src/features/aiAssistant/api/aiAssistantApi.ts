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
  const raw = (response as any)?.data;
  if (raw && 'answer' in raw) return raw;
  if (response && 'answer' in response) return response as any;
  return raw || response;
};
