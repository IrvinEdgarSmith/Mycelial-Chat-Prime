import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, UserRound, Check, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { SystemPersona } from '@/types';

const ChatInterface: React.FC = () => {
  const { 
    currentWorkspaceId,
    currentThreadId,
    currentThread,
    sendMessage,
    currentWorkspace,
    updateWorkspaceSettings,
    getKnowledgeContext
  } = useWorkspace();

  const { settings } = useGlobalSettings();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedPersona, setSelectedPersona] = useState<SystemPersona | null>(null);

  // Get the selected persona from workspace settings when component loads
  useEffect(() => {
    if (currentWorkspace?.settings?.selectedPersonaId) {
      const persona = settings.systemPersonas.find(
        p => p.id === currentWorkspace.settings.selectedPersonaId
      );
      if (persona) {
        setSelectedPersona(persona);
      }
    } else {
      setSelectedPersona(null);
    }
  }, [currentWorkspace?.settings?.selectedPersonaId, settings.systemPersonas]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);
  
  // Check if knowledge is enabled and included in the current workspace
  const hasKnowledgeInContext = currentWorkspaceId ? 
    getKnowledgeContext(currentWorkspaceId).length > 0 : false;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    try {
      setIsLoading(true);
      
      // Base system prompt
      let systemPrompt = currentWorkspace?.settings?.customSystemPrompt || 
                         "You are a helpful assistant.";
      
      // Add persona prompt addition if selected
      if (selectedPersona) {
        systemPrompt = `${selectedPersona.promptAddition}\n\n${systemPrompt}`;
      }
      
      await sendMessage(userMessage, systemPrompt);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectPersona = (persona: SystemPersona | null) => {
    setSelectedPersona(persona);
    
    if (currentWorkspaceId) {
      updateWorkspaceSettings(currentWorkspaceId, {
        selectedPersonaId: persona?.id
      });
      
      toast({
        title: persona ? `${persona.name} Selected` : "Default Persona",
        description: persona ? 
          `This persona will now influence your conversation.` : 
          `Using default assistant behavior.`,
        duration: 2000,
      });
    }
  };

  // Get input background gradient based on selected persona
  const getInputBackgroundStyle = () => {
    if (selectedPersona) {
      if (selectedPersona.gradientFrom && selectedPersona.gradientTo) {
        return {
          background: `linear-gradient(to right, ${selectedPersona.gradientFrom}, ${selectedPersona.gradientTo})`,
          opacity: 0.1
        };
      } else {
        return {
          background: selectedPersona.iconColor,
          opacity: 0.1
        };
      }
    } else {
      // Default workspace color gradient (indigo to magenta)
      return {
        background: 'linear-gradient(to right, #9b87f5, #D946EF)',
        opacity: 0.1
      };
    }
  };

  // Get persona avatar for AI messages
  const getPersonaAvatar = () => {
    if (selectedPersona) {
      return (
        <AvatarFallback 
          style={{ 
            background: selectedPersona.gradientFrom && selectedPersona.gradientTo ? 
              `linear-gradient(to right, ${selectedPersona.gradientFrom}, ${selectedPersona.gradientTo})` :
              selectedPersona.iconColor 
          }}
        >
          {selectedPersona.name?.substring(0, 2) || 'AI'}
        </AvatarFallback>
      );
    } else {
      return (
        <AvatarImage src="/assets/bot-avatar.png" alt="AI" />
      );
    }
  };

  // Safely get messages from the current thread
  const messages = currentThread?.messages || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ 
                  background: selectedPersona ? 
                    (selectedPersona.gradientFrom && selectedPersona.gradientTo ? 
                      `linear-gradient(to right, ${selectedPersona.gradientFrom}, ${selectedPersona.gradientTo})` :
                      selectedPersona.iconColor) : 
                    'linear-gradient(to right, #9b87f5, #D946EF)'
                }}
              >
                <UserRound className="h-3 w-3 text-white" />
              </div>
              <span className="sr-only">Select Persona</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Persona</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleSelectPersona(null)}
              className="flex items-center justify-between"
            >
              Default
              {!selectedPersona && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            
            {settings.systemPersonas
              .filter(persona => persona.visibleInChat !== false)
              .map(persona => (
                <DropdownMenuItem 
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ 
                        background: persona.gradientFrom && persona.gradientTo ? 
                          `linear-gradient(to right, ${persona.gradientFrom}, ${persona.gradientTo})` :
                          persona.iconColor 
                      }}
                    ></div>
                    {persona.name}
                  </div>
                  {selectedPersona?.id === persona.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {hasKnowledgeInContext && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-mycelial-secondary text-xs ml-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  <span>RAG</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Knowledge items are being used to enhance responses
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">Start a new conversation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send a message to begin chatting with the AI assistant
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex items-start gap-3 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'flex-row-reverse' 
                      : 'flex-row'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Avatar className="h-8 w-8">
                      {getPersonaAvatar()}
                    </Avatar>
                  ) : null}
                  
                  <div 
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-mycelial-messages-user-from to-mycelial-messages-user-to text-white' 
                        : 'bg-gradient-to-r from-mycelial-messages-ai-from to-mycelial-messages-ai-to text-white'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        code({className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !match ? (
                            <code className="bg-mycelial-card px-1.5 py-0.5 rounded-md text-gray-300" {...props}>
                              {children}
                            </code>
                          ) : (
                            <SyntaxHighlighter
                              language={match[1]}
                              style={vscDarkPlus}
                              customStyle={{backgroundColor: '#1A1F2C'}}
                              codeTagProps={{
                                style: {
                                  color: '#d4d4d8'
                                }
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t relative">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={getInputBackgroundStyle()}
        ></div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto relative z-10">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[60px] resize-none pr-12 bg-transparent backdrop-blur-sm"
              disabled={isLoading}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon"
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 bottom-2 h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send message</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
        
        {hasKnowledgeInContext && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-xs text-mycelial-secondary flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              Using Knowledge Items to enhance responses
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
