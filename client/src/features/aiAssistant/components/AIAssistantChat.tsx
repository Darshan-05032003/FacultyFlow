import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askAssistant, AIResponse } from '../api/aiAssistantApi';

export const AIAssistantChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai'; text: string; data?: AIResponse }[]>([]);

  const aiMutation = useMutation({
    mutationFn: (msg: string) => askAssistant(msg),
    onSuccess: (data) => {
      setHistory(prev => [...prev, { role: 'ai', text: data.answer, data }]);
    },
    onError: () => {
      setHistory(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to the AI provider." }]);
    }
  });

  const handleSend = () => {
    if (!message.trim()) return;
    setHistory(prev => [...prev, { role: 'user', text: message }]);
    aiMutation.mutate(message);
    setMessage('');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Ask AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden max-h-[80vh]">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          FacultyFlow AI Assistant
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        {history.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-4">
            Ask me about your workload, forecast, or how to prioritize tasks!
          </div>
        )}
        {history.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              
              {msg.data && msg.data.keyFactors && msg.data.keyFactors.length > 0 && (
                <div className="mt-2 text-xs border-t border-gray-100 pt-2">
                  <span className="font-semibold text-gray-600">Key Factors:</span>
                  <ul className="list-disc pl-4 mt-1 text-gray-600">
                    {msg.data.keyFactors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {msg.data && msg.data.suggestedActions && msg.data.suggestedActions.length > 0 && (
                <div className="mt-2 text-xs border-t border-gray-100 pt-2">
                  <span className="font-semibold text-blue-600">Suggested Actions:</span>
                  <ul className="list-disc pl-4 mt-1 text-blue-600">
                    {msg.data.suggestedActions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {msg.data?.isFallback && (
                <div className="mt-2 text-[10px] text-amber-600 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Running in fallback mode (deterministic)
                </div>
              )}
            </div>
          </div>
        ))}
        {aiMutation.isPending && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-200 text-gray-500 rounded-lg rounded-bl-none p-3 shadow-sm text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input 
            type="text" 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Ask about your workload..." 
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={aiMutation.isPending}
          />
          <button 
            type="submit" 
            disabled={!message.trim() || aiMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            Send
          </button>
        </form>
        {history.length > 0 && history[history.length - 1].data?.disclaimer && (
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            {history[history.length - 1].data!.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
};
