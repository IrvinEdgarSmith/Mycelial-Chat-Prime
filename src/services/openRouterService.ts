import axios from 'axios';
import React from 'react';

export const useOpenRouter = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    return {
        isLoading,
        setIsLoading
    };
};

export interface OpenRouterChatMessage {
    role: string;
    content: string;
}

export interface OpenRouterCallParams {
    modelId: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    apiKey: string;
    knowledgeContext?: string;
}

export const fetchOpenRouterModels = async (apiKey: string) => {
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Mycelial AI'
            }
        });
        
        // Only include models that support chat completions
        const validModels = response.data.data.filter((model: any) => 
            model.capabilities?.completion || model.context_length > 0
        );
        
        return validModels;
    } catch (error) {
        console.error('Error fetching models from OpenRouter:', error);
        throw error;
    }
};

export const getChatCompletion = async (
    apiKey: string, 
    modelId: string, 
    messages: OpenRouterChatMessage[], 
    temperature = 0.7,
    knowledgeContext?: string
) => {
    try {
        // If there's a knowledge context, add it to the system message
        if (knowledgeContext && messages.length > 0 && messages[0].role === 'system') {
            messages[0].content = `${messages[0].content}\n\nHere is additional context that may be relevant to the conversation:\n\n${knowledgeContext}`;
        }
        
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: modelId,
                messages: messages,
                temperature: temperature,
                max_tokens: 4000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Mycelial AI'
                }
            }
        );
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error getting chat completion from OpenRouter:', error);
        throw error;
    }
};

// Function to call OpenRouter directly with a prompt and system prompt
export const callOpenRouter = async ({
    modelId,
    prompt,
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    apiKey,
    knowledgeContext
}: OpenRouterCallParams) => {
    try {
        // Create the messages array
        const messages = [
            {
                role: 'system',
                content: knowledgeContext 
                    ? `${systemPrompt}\n\nHere is additional context that may be relevant:\n\n${knowledgeContext}` 
                    : systemPrompt
            },
            {
                role: 'user',
                content: prompt
            }
        ];
        
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: modelId,
                messages: messages,
                temperature: temperature,
                max_tokens: 4000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Mycelial AI'
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error calling OpenRouter:', error);
        throw error;
    }
};
