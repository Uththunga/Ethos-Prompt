// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultModel: string;
  autoSave: boolean;
  notifications: boolean;
}

// Prompt types
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
  variables: PromptVariable[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
}

// Template types for the enhanced prompt library
export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
  variables: PromptVariable[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCase: string[];
  industry: string[];
  rating: number;
  usageCount: number;
  author: string;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface PromptSuggestion {
  type:
    | 'structure'
    | 'clarity'
    | 'variable'
    | 'rag'
    | 'performance'
    | 'specificity'
    | 'actionability'
    | 'format'
    | 'tone'
    | 'readability';
  title: string;
  description: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFix?: boolean;
  // Enhanced fields for better prioritization and guidance
  impact?: 'low' | 'medium' | 'high'; // Expected improvement impact
  effort?: 'low' | 'medium' | 'high'; // Effort required to implement
  priority?: number; // Calculated priority score (1-10, higher = more important)
  examples?: string[]; // Concrete examples
  beforeAfter?: { before: string; after: string }; // Show transformation
  category?: string; // Grouping category for organization
}

export interface PromptQualityScore {
  overall: number;
  // Core metrics
  structure: number;
  clarity: number;
  variables: number;
  ragCompatibility: number;
  industryOptimization: number;
  // New enhanced metrics
  specificity: number; // How specific vs generic the prompt is
  actionability: number; // How actionable the instructions are
  contextCompleteness: number; // Whether sufficient context is provided
  outputFormatClarity: number; // Whether expected output format is specified
  toneConsistency: number; // Tone consistency score
  readability: number; // Flesch-Kincaid readability score
  suggestions: PromptSuggestion[];
}

export interface PromptExecution {
  id: string;
  promptId: string;
  inputs: Record<string, string | number | boolean>;
  outputs: {
    content: string;
    metadata: {
      model: string;
      tokensUsed: number;
      executionTime: number;
      cost: number;
      promptTokens?: number;
      completionTokens?: number;
      finishReason?: string;
    };
  };
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  context?: string;
  ragContext?: RAGContext; // Full RAG context with chunks
  ragMetadata?: {
    query?: string;
    total_chunks_found?: number;
    chunks_used?: number;
    context_length?: number;
    similarity_scores?: number[];
    document_sources?: string[];
  };
}

// RAG types
export interface RAGDocument {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedAt: { seconds: number; toDate: () => Date } | Date;
  size: number;
  type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processingStartedAt?: { seconds: number; toDate: () => Date } | Date;
  processedAt?: { seconds: number; toDate: () => Date } | Date;
  chunks: string[];
  metadata: {
    originalSize: number;
    contentType: string;
    chunk_count?: number;
    character_count?: number;
    word_count?: number;
    page_count?: number;
    extraction_method?: string;
    embedding_stats?: {
      total_chunks: number;
      chunks_with_embeddings: number;
      chunks_with_errors: number;
      success_rate: number;
      embedding_model: string;
    };
  };
  error?: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    startIndex: number;
    endIndex: number;
  };
  embedding?: number[];
}

// RAG Context types for execution preview
export interface RAGContextChunk {
  chunk_id: string;
  content: string;
  relevance_score: number;
  token_count: number;
  source_document: string;
  rank: number;
  metadata: {
    page?: number;
    section?: string;
    filename?: string;
    file_type?: string;
    chunk_position?: number;
    created_at?: string;
    [key: string]: any;
  };
  context_type?: 'retrieved' | 'conversation' | 'expanded';
}

export interface RAGContext {
  chunks: RAGContextChunk[];
  total_tokens: number;
  retrieval_time: number;
  query_expansion?: string;
  conversation_context?: string;
  metadata?: {
    original_query?: string;
    search_results_count?: number;
    relevant_results_count?: number;
    final_chunks_count?: number;
    use_hybrid_search?: boolean;
    search_time?: number;
    average_relevance?: number;
    [key: string]: any;
  };
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface WorkspaceSettings {
  isPublic: boolean;
  allowInvites: boolean;
  defaultPermissions: 'read' | 'write' | 'admin';
}

// AI-Assisted Prompt Generation Types
export interface PromptGenerationRequest {
  purpose: string;
  industry: string;
  useCase: string;
  targetAudience?: string;
  inputVariables: PromptGenerationVariable[];
  outputFormat: 'paragraph' | 'bullet_points' | 'structured_data' | 'json' | 'table' | 'list';
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | 'formal' | 'creative';
  length: 'short' | 'medium' | 'long';
  includeRAG?: boolean;
  additionalRequirements?: string;
}

export interface PromptGenerationVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  example?: string;
}

export interface PromptGenerationResponse {
  generatedPrompt: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  variables: PromptVariable[];
  qualityScore: PromptQualityScore;
  suggestions: PromptEnhancementSuggestion[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
  };
}

export interface PromptEnhancementSuggestion {
  id: string;
  type:
    | 'clarity'
    | 'structure'
    | 'variables'
    | 'industry_specific'
    | 'performance'
    | 'rag_optimization';
  title: string;
  description: string;
  originalText?: string;
  suggestedText?: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  autoApplicable: boolean;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  commonUseCases: string[];
  recommendedTone: string[];
  typicalVariables: string[];
  bestPractices: string[];
}

export interface PromptGenerationFormData {
  step: 'basic_info' | 'variables' | 'preferences' | 'review';
  basicInfo: {
    purpose: string;
    industry: string;
    useCase: string;
    targetAudience: string;
  };
  variables: PromptGenerationVariable[];
  preferences: {
    outputFormat: string;
    tone: string;
    length: string;
    includeRAG: boolean;
    additionalRequirements: string;
  };
}

// Re-export analytics types for better module resolution
export type {
    AnalyticsData,
    BasicMetrics,
    RecentActivity,
    TopPrompt
} from '../services/analyticsService';

// Re-export layout types
export type { LayoutActions, LayoutContextValue, LayoutState, RightPanelType } from './layout';

// Re-export contact management types
export type {
    Contact, ContactActivity, ContactActivityDirection,
    ContactActivityMetadata, ContactActivityType, ContactMeta,
    ContactMetaOriginalLeadIds,
    ContactMetadata, ContactSource, ContactStatus, EmailEvent,
    EmailEventType, EmailJob, EmailJobScheduleType, EmailJobStatus, EmailSequence, EmailSequenceConditionOp, EmailSequenceStep,
    EmailSequenceStepCondition, EmailTemplate,
    EmailTemplateType, UserRole,
    UserRoleRecord
} from './contacts';
