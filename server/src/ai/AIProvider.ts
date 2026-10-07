export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  isFallback?: boolean;
}

export interface AIProvider {
  generateResponse(request: AIRequest): Promise<AIResponse>;
}
