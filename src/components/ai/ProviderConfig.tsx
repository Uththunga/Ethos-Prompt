/**
 * Provider Configuration Component - Manage AI provider settings and selection
 */
import React, { useState, useEffect } from 'react';
import { Settings, Zap, DollarSign, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { aiService, type SystemStatus } from '@/services/aiService';

interface ProviderStatus {
  available: boolean;
  latency?: number;
  error?: string;
}

interface ProviderInfo {
  name: string;
  displayName: string;
  models: string[];
  maxTokens: number;
  costPer1kTokens: number;
  features: {
    streaming: boolean;
    functionCalling: boolean;
    multimodal: boolean;
    embeddings: boolean;
  };
  status: ProviderStatus;
}

interface ProviderConfigProps {
  onProviderChange?: (provider: string, model: string) => void;
  onConfigChange?: (config: any) => void;
  className?: string;
}

const defaultProviders: Record<string, ProviderInfo> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    maxTokens: 128000,
    costPer1kTokens: 0.0015,
    features: {
      streaming: true,
      functionCalling: true,
      multimodal: true,
      embeddings: true
    },
    status: { available: true }
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    features: {
      streaming: true,
      functionCalling: false,
      multimodal: true,
      embeddings: false
    },
    status: { available: true }
  },
  google: {
    name: 'google',
    displayName: 'Google',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    maxTokens: 32768,
    costPer1kTokens: 0.0005,
    features: {
      streaming: true,
      functionCalling: true,
      multimodal: true,
      embeddings: true
    },
    status: { available: true }
  },
  cohere: {
    name: 'cohere',
    displayName: 'Cohere',
    models: ['command-r-plus', 'command-r'],
    maxTokens: 4096,
    costPer1kTokens: 0.001,
    features: {
      streaming: true,
      functionCalling: false,
      multimodal: false,
      embeddings: true
    },
    status: { available: true }
  }
};

export const ProviderConfig: React.FC<ProviderConfigProps> = ({
  onProviderChange,
  onConfigChange,
  className = ''
}) => {
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>(defaultProviders);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [enableStreaming, setEnableStreaming] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const { toast } = useToast();

  // Load system status on component mount
  useEffect(() => {
    loadSystemStatus();
  }, []);

  // Update provider when selection changes
  useEffect(() => {
    onProviderChange?.(selectedProvider, selectedModel);
  }, [selectedProvider, selectedModel, onProviderChange]);

  // Update config when settings change
  useEffect(() => {
    const config = {
      provider: selectedProvider,
      model: selectedModel,
      temperature,
      max_tokens: maxTokens,
      enable_streaming: enableStreaming
    };
    onConfigChange?.(config);
  }, [selectedProvider, selectedModel, temperature, maxTokens, enableStreaming, onConfigChange]);

  const loadSystemStatus = async () => {
    try {
      setIsLoading(true);
      const status = await aiService.getSystemStatus();
      setSystemStatus(status);

      // Update provider status based on system status
      if (status.success && status.providers) {
        const updatedProviders = { ...providers };

        Object.keys(updatedProviders).forEach(providerName => {
          const providerStatus = status.providers.status[providerName];
          if (providerStatus) {
            updatedProviders[providerName].status = providerStatus;
          }
        });

        setProviders(updatedProviders);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
      toast({
        title: 'Status Check Failed',
        description: 'Unable to check provider status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    // Set default model for the provider
    const providerInfo = providers[provider];
    if (providerInfo && providerInfo.models.length > 0) {
      setSelectedModel(providerInfo.models[0]);
    }
  };

  const getProviderStatusBadge = (status: ProviderStatus) => {
    if (!status.available) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Unavailable
        </Badge>
      );
    }

    if (status.latency !== undefined) {
      const latencyColor = status.latency < 1000 ? 'default' : status.latency < 2000 ? 'secondary' : 'destructive';
      return (
        <Badge variant={latencyColor} className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {status.latency}ms
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Available
      </Badge>
    );
  };

  const getFeatureBadges = (features: ProviderInfo['features']) => {
    const badges = [];

    if (features.streaming) badges.push(<Badge key="streaming" variant="outline">Streaming</Badge>);
    if (features.functionCalling) badges.push(<Badge key="functions" variant="outline">Functions</Badge>);
    if (features.multimodal) badges.push(<Badge key="multimodal" variant="outline">Multimodal</Badge>);
    if (features.embeddings) badges.push(<Badge key="embeddings" variant="outline">Embeddings</Badge>);

    return badges;
  };

  const currentProvider = providers[selectedProvider];

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">AI Provider Configuration</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSystemStatus}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh Status'
          )}
        </Button>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Provider Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(providers).map((provider) => (
              <div
                key={provider.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider === provider.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleProviderChange(provider.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{provider.displayName}</h4>
                  {getProviderStatusBadge(provider.status)}
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    ${provider.costPer1kTokens}/1K tokens
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {provider.maxTokens.toLocaleString()} max tokens
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getFeatureBadges(provider.features)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model and Configuration */}
      {currentProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Model Selection */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="model-select">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Temperature */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature</Label>
                <span className="text-sm text-muted-foreground">{temperature}</span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness: 0 is focused, 2 is creative
              </p>
            </div>

            {/* Max Tokens */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <span className="text-sm text-muted-foreground">{maxTokens}</span>
              </div>
              <Slider
                id="max-tokens"
                min={100}
                max={Math.min(currentProvider.maxTokens, 4000)}
                step={100}
                value={[maxTokens]}
                onValueChange={(value) => setMaxTokens(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximum tokens in the response
              </p>
            </div>

            {/* Streaming */}
            {currentProvider.features.streaming && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="streaming">Enable Streaming</Label>
                  <p className="text-xs text-muted-foreground">
                    Stream responses in real-time
                  </p>
                </div>
                <Switch
                  id="streaming"
                  checked={enableStreaming}
                  onCheckedChange={setEnableStreaming}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.providers?.available?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Available Providers</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  systemStatus.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.status === 'healthy' ? '✓' : '✗'}
                </div>
                <div className="text-sm text-muted-foreground">System Health</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(systemStatus.services || {}).filter(Boolean).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date(systemStatus.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
