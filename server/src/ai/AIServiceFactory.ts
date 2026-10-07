import { AIProvider } from './AIProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { env } from '../config/env';

export class AIServiceFactory {
  static getProvider(): AIProvider | null {
    if (!env.AI_API_KEY) {
      return null;
    }
    
    if (env.AI_PROVIDER === 'google') {
      return new GoogleProvider();
    }
    
    // Add other providers here if needed
    
    return null;
  }
}
