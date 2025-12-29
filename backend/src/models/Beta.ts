import mongoose, { Document, Schema } from 'mongoose';

// Beta Application Interface
export interface IBetaApplication extends Document {
  userId: string;
  name: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  experience?: string;
  expectations?: string;
  teamSize?: string;
  timeline?: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

// Beta User Interface
export interface IBetaUser extends Document {
  userId: string;
  email: string;
  name: string;
  company: string;
  approvedAt: Date;
  approvedBy: string;
  features: {
    advancedRAG: boolean;
    prioritySupport: boolean;
    betaFeatures: boolean;
    increasedLimits: boolean;
    customIntegrations?: boolean;
    advancedAnalytics?: boolean;
  };
  limits: {
    monthlyExecutions: number;
    monthlyTokens: number;
    maxDocuments: number;
    maxWorkspaces: number;
    maxTeamMembers?: number;
  };
  usage: {
    currentMonthExecutions: number;
    currentMonthTokens: number;
    totalExecutions: number;
    totalTokens: number;
    lastResetDate: Date;
  };
  feedback: Array<{
    date: Date;
    category: string;
    rating: number;
    comment: string;
    feature?: string;
  }>;
  notes?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Beta Application Schema
const BetaApplicationSchema = new Schema<IBetaApplication>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['developer', 'product-manager', 'content-creator', 'marketing', 'researcher', 'executive', 'other']
  },
  useCase: {
    type: String,
    required: true,
    maxlength: 2000
  },
  experience: {
    type: String,
    maxlength: 2000
  },
  expectations: {
    type: String,
    maxlength: 2000
  },
  teamSize: {
    type: String,
    enum: ['1', '2-5', '6-20', '21-100', '100+']
  },
  timeline: {
    type: String,
    enum: ['immediate', 'short-term', 'medium-term', 'long-term', 'exploring']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted'],
    default: 'pending',
    index: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Beta User Schema
const BetaUserSchema = new Schema<IBetaUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  approvedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  approvedBy: {
    type: String,
    required: true
  },
  features: {
    advancedRAG: {
      type: Boolean,
      default: true
    },
    prioritySupport: {
      type: Boolean,
      default: true
    },
    betaFeatures: {
      type: Boolean,
      default: true
    },
    increasedLimits: {
      type: Boolean,
      default: true
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    }
  },
  limits: {
    monthlyExecutions: {
      type: Number,
      default: 10000
    },
    monthlyTokens: {
      type: Number,
      default: 1000000
    },
    maxDocuments: {
      type: Number,
      default: 1000
    },
    maxWorkspaces: {
      type: Number,
      default: 10
    },
    maxTeamMembers: {
      type: Number,
      default: 50
    }
  },
  usage: {
    currentMonthExecutions: {
      type: Number,
      default: 0
    },
    currentMonthTokens: {
      type: Number,
      default: 0
    },
    totalExecutions: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  feedback: [{
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      required: true,
      enum: ['feature', 'bug', 'performance', 'ui', 'documentation', 'general']
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000
    },
    feature: {
      type: String,
      maxlength: 100
    }
  }],
  notes: {
    type: String,
    maxlength: 2000
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BetaApplicationSchema.index({ email: 1, userId: 1 });
BetaApplicationSchema.index({ status: 1, submittedAt: -1 });
BetaApplicationSchema.index({ company: 1 });

BetaUserSchema.index({ userId: 1 });
BetaUserSchema.index({ email: 1 });
BetaUserSchema.index({ isActive: 1, expiresAt: 1 });
BetaUserSchema.index({ 'usage.lastResetDate': 1 });

// Pre-save middleware to reset monthly usage if needed
BetaUserSchema.pre('save', function(next) {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;
  
  // Reset monthly usage if it's a new month
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    this.usage.currentMonthExecutions = 0;
    this.usage.currentMonthTokens = 0;
    this.usage.lastResetDate = now;
  }
  
  next();
});

// Static methods for BetaUser
BetaUserSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId, isActive: true });
};

BetaUserSchema.statics.checkLimits = function(userId: string, executionCount: number, tokenCount: number) {
  return this.findOne({ userId, isActive: true }).then((betaUser: IBetaUser | null) => {
    if (!betaUser) {
      return { allowed: false, reason: 'Not a beta user' };
    }
    
    if (betaUser.usage.currentMonthExecutions + executionCount > betaUser.limits.monthlyExecutions) {
      return { allowed: false, reason: 'Monthly execution limit exceeded' };
    }
    
    if (betaUser.usage.currentMonthTokens + tokenCount > betaUser.limits.monthlyTokens) {
      return { allowed: false, reason: 'Monthly token limit exceeded' };
    }
    
    return { allowed: true, betaUser };
  });
};

BetaUserSchema.statics.updateUsage = function(userId: string, executionCount: number, tokenCount: number) {
  return this.findOneAndUpdate(
    { userId, isActive: true },
    {
      $inc: {
        'usage.currentMonthExecutions': executionCount,
        'usage.currentMonthTokens': tokenCount,
        'usage.totalExecutions': executionCount,
        'usage.totalTokens': tokenCount
      }
    },
    { new: true }
  );
};

// Instance methods
BetaUserSchema.methods.addFeedback = function(feedback: {
  category: string;
  rating: number;
  comment: string;
  feature?: string;
}) {
  this.feedback.push({
    ...feedback,
    date: new Date()
  });
  return this.save();
};

BetaUserSchema.methods.hasFeature = function(feature: string): boolean {
  return this.features[feature] === true;
};

BetaUserSchema.methods.getRemainingLimits = function() {
  return {
    executions: Math.max(0, this.limits.monthlyExecutions - this.usage.currentMonthExecutions),
    tokens: Math.max(0, this.limits.monthlyTokens - this.usage.currentMonthTokens),
    documents: this.limits.maxDocuments,
    workspaces: this.limits.maxWorkspaces,
    teamMembers: this.limits.maxTeamMembers
  };
};

// Export models
export const BetaApplication = mongoose.model<IBetaApplication>('BetaApplication', BetaApplicationSchema);
export const BetaUser = mongoose.model<IBetaUser>('BetaUser', BetaUserSchema);
