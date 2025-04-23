import React, { useState, useRef, useEffect } from 'react';
import { useAgentApi } from '../utils/api';
import { FiSend, FiSettings, FiRefreshCw } from 'react-icons/fi';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  systemPrompt?: string;
  placeholder?: string;
  className?: string;
}

const AgentChat: React.FC<AgentChatProps> = ({
  systemPrompt = 'You are a helpful AI assistant.',
  placeholder = 'Ask me anything...',
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { streamAgent, getAvailableModels, apiAvailable } = useAgentApi();

  // Default models to use when API call fails
  const defaultModels = [
    {
      id: 'gpt-4o',
      provider: 'openai',
      name: 'GPT-4o',
      description: 'OpenAI\'s most capable model for text, vision, and reasoning',
    },
    {
      id: 'gpt-3.5-turbo',
      provider: 'openai',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and cost-effective language model',
    },
    {
      id: 'claude-3-5-sonnet',
      provider: 'anthropic',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s most capable model with strong reasoning',
    }
  ];

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getAvailableModels();
        if (response.success && response.models) {
          setAvailableModels(response.models);
        }
      } catch (error) {
        // Use default models if API call fails
        setAvailableModels(defaultModels);
      }
    };
    
    fetchModels();
  }, [getAvailableModels]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the assistant's response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    try {
      let fullResponse = '';
      
      await streamAgent(
        input,
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        () => {
          setIsLoading(false);
        },
        {
          model,
          temperature,
          systemPrompt,
        }
      );
    } catch (error) {
      console.error('Error in chat handling:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error processing your request. Please try again.',
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Agentive AI Chat</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
            aria-label="Settings"
          >
            <FiSettings />
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
            aria-label="Clear chat"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="mb-2 font-medium">Chat Settings</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 text-sm font-medium">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border rounded"
                aria-label="Select AI model"
                title="AI Model"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
                aria-label="Temperature setting"
                title="Temperature"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="mb-4 text-lg">No messages yet</p>
            <p className="max-w-md text-sm">
              Start a conversation with the AI assistant by typing a message below.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Message input"
            title="Type your message here"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center p-2 text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            aria-label="Send message"
            title="Send"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentChat;
