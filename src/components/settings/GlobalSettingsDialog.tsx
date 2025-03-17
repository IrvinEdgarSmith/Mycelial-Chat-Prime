import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { Key, MessageSquare, Settings, Users, Globe } from 'lucide-react';
import SystemPersonasManager from './SystemPersonasManager';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkspace } from '@/context/WorkspaceContext';
import { toast } from '@/components/ui/use-toast';

interface GlobalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSettingsDialog: React.FC<GlobalSettingsDialogProps> = ({ open, onOpenChange }) => {
  const { settings, updateSettings } = useGlobalSettings();
  const { workspaces, updateWorkspaceSettings, updateAllWorkspacesSettings } = useWorkspace();
  const [openRouterApiKey, setOpenRouterApiKey] = useState(settings.openRouterApiKey);
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState(settings.defaultSystemPrompt);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [braveApiKey, setBraveApiKey] = useState(settings.braveApiKey || '');
  const [activeTab, setActiveTab] = useState('api-keys');
  
  useEffect(() => {
    // Update state when settings change
    setOpenRouterApiKey(settings.openRouterApiKey);
    setDefaultSystemPrompt(settings.defaultSystemPrompt);
    setGeminiApiKey(settings.geminiApiKey);
    setBraveApiKey(settings.braveApiKey || '');
  }, [settings]);
  
  const handleSaveApiKeys = () => {
    updateSettings({
      openRouterApiKey,
      geminiApiKey,
      braveApiKey
    });
    
    // Store in localStorage for easy access by all components
    localStorage.setItem('openrouter-api-key', openRouterApiKey);
    
    // Update all workspaces to use this API key for consistency
    if (openRouterApiKey !== settings.openRouterApiKey) {
      // Use the new updateAllWorkspacesSettings function
      updateAllWorkspacesSettings({ 
        openRouterApiKey 
      });
    }
    
    toast({
      title: "API Keys Saved",
      description: "Your API keys have been updated for all workspaces."
    });
  };
  
  const handleSaveSystemPrompt = () => {
    updateSettings({
      defaultSystemPrompt
    });
    
    toast({
      title: "System Prompt Saved",
      description: "Your default system prompt has been updated."
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] glassmorphism border-mycelial-border/40 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-mycelial-secondary to-mycelial-tertiary">
            Global Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-mycelial-secondary/20">
              <Key size={14} className="mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="system-prompt" className="data-[state=active]:bg-mycelial-secondary/20">
              <MessageSquare size={14} className="mr-2" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="personas" className="data-[state=active]:bg-mycelial-secondary/20">
              <Users size={14} className="mr-2" />
              System Personas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4">
            <ScrollArea className="pr-4 max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="Enter your OpenRouter API key"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  className="bg-mycelial-background/40 border-mycelial-border/30"
                />
                <p className="text-xs text-muted-foreground">
                  Required for chat functionality. Get a key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-mycelial-secondary underline">openrouter.ai</a>
                </p>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="bg-mycelial-background/40 border-mycelial-border/30"
                />
                <p className="text-xs text-muted-foreground">
                  Required for embedding functionality. Get a key at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-mycelial-secondary underline">ai.google.dev</a>
                </p>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label htmlFor="brave-key" className="flex items-center">
                  <Globe size={14} className="mr-2 text-blue-400" />
                  Brave Search API Key
                </Label>
                <Input
                  id="brave-key"
                  type="password"
                  placeholder="Enter your Brave Search API key"
                  value={braveApiKey}
                  onChange={(e) => setBraveApiKey(e.target.value)}
                  className="bg-mycelial-background/40 border-mycelial-border/30"
                />
                <p className="text-xs text-muted-foreground">
                  Required for web search functionality. Get a key at <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-mycelial-secondary underline">brave.com/search/api</a>
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleSaveApiKeys}
                  className="bg-mycelial-secondary hover:bg-mycelial-secondary/90"
                >
                  Save API Keys
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="system-prompt" className="space-y-4">
            <ScrollArea className="pr-4 max-h-[60vh]">
              <div className="space-y-2">
                <Label htmlFor="default-prompt">Default System Prompt</Label>
                <Textarea
                  id="default-prompt"
                  placeholder="Enter default system instructions for the AI..."
                  value={defaultSystemPrompt}
                  onChange={(e) => setDefaultSystemPrompt(e.target.value)}
                  className="min-h-[200px] bg-mycelial-background/40 border-mycelial-border/30"
                />
                <p className="text-xs text-muted-foreground">
                  This is the default system prompt that will be used for all workspaces unless overridden.
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleSaveSystemPrompt}
                  className="bg-mycelial-secondary hover:bg-mycelial-secondary/90"
                >
                  Save System Prompt
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="personas">
            <ScrollArea className="pr-4 max-h-[60vh]">
              <SystemPersonasManager />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSettingsDialog;
