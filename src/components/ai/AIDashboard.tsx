import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MessageSquare,
    Upload,
    Search,
    BarChart3, Bot,
    FileText,
    Zap,
    DollarSign,
    Clock
} from 'lucide-react';

import { AIChat } from './AIChat';
import { DocumentUpload } from './DocumentUpload';
import { DocumentSearch } from './DocumentSearch';

interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  documents_processed: number;
  avg_response_time: number;
}

interface SystemStatus {
  status: string;
  providers: {
    available: string[];
    status: Record<string, any>;
  };
  services: Record<string, boolean>;
}

export const AIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load usage stats
      const statsResponse = await fetch('/api/ai/usage-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUsageStats(statsData);
      }

      // Load system status
      const statusResponse = await fetch('/api/ai/system-status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationStart = (newConversationId: string) => {
    setConversationId(newConversationId);
  };

  const handleDocumentUpload = (documentId: string, filename: string) => {
    // Optionally switch to search tab or show notification
    console.log('Document uploaded:', { documentId, filename });
  };

  const handleSearchResultSelect = (result: any) => {
    // Optionally switch to chat tab and start conversation with context
    console.log('Search result selected:', result);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent document processing and conversational AI
          </p>
        </div>

        {systemStatus && (
          <div className="flex items-center gap-2">
            <Badge
              variant={systemStatus.status === 'healthy' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {systemStatus.status === 'healthy' ? '🟢' : '🔴'} System {systemStatus.status}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {systemStatus.providers.available.length} Providers
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Requests</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatNumber(usageStats.total_requests)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Tokens</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatNumber(usageStats.total_tokens)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Cost</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(usageStats.total_cost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatNumber(usageStats.documents_processed)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Avg Time</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {usageStats.avg_response_time.toFixed(2)}s
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regular Chat */}
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <AIChat
                  conversationId={conversationId}
                  useRAG={false}
                  onConversationStart={handleConversationStart}
                  className="h-full"
                />
              </CardContent>
            </Card>

            {/* RAG Chat */}
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Document Chat (RAG)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <AIChat
                  conversationId={conversationId}
                  useRAG={true}
                  onConversationStart={handleConversationStart}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Document Upload
              </CardTitle>
              <p className="text-sm text-gray-600">
                Upload documents to enable RAG-powered conversations and search
              </p>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                onUploadComplete={handleDocumentUpload}
                maxFiles={10}
                maxFileSize={50}
                acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="flex flex-col gap-4">
          <DocumentSearch
            onResultSelect={handleSearchResultSelect}
          />
        </TabsContent>

        <TabsContent value="analytics" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                {systemStatus ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Overall Status</span>
                      <Badge
                        variant={systemStatus.status === 'healthy' ? 'default' : 'destructive'}
                      >
                        {systemStatus.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Available Providers</h4>
                      <div className="flex flex-wrap gap-2">
                        {systemStatus.providers.available.map((provider) => (
                          <Badge key={provider} variant="outline">
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Services</h4>
                      <div className="flex flex-col gap-2">
                        {Object.entries(systemStatus.services).map(([service, status]) => (
                          <div key={service} className="flex items-center justify-between">
                            <span className="text-sm">{service.replace('_', ' ')}</span>
                            <Badge variant={status ? 'default' : 'destructive'}>
                              {status ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading system status...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {usageStats ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatNumber(usageStats.total_requests)}
                        </div>
                        <div className="text-sm text-blue-600">Total Requests</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(usageStats.total_cost)}
                        </div>
                        <div className="text-sm text-green-600">Total Cost</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tokens Used</span>
                        <span className="font-medium">{formatNumber(usageStats.total_tokens)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Documents Processed</span>
                        <span className="font-medium">{formatNumber(usageStats.documents_processed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-medium">{usageStats.avg_response_time.toFixed(2)}s</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadDashboardData}
                    >
                      Refresh Stats
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading usage statistics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
