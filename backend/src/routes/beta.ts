import express from 'express';
import { auth } from '../middleware/auth';
import { admin } from '../middleware/admin';
import { BetaApplication, BetaUser } from '../models/Beta';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';

const router = express.Router();

// Submit beta application
router.post('/applications', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      role,
      useCase,
      experience,
      expectations,
      teamSize,
      timeline
    } = req.body;

    // Check if user already applied
    const existingApplication = await BetaApplication.findOne({
      $or: [
        { email },
        { userId: req.user.uid }
      ]
    });

    if (existingApplication) {
      return res.status(409).json({
        error: {
          code: 'APPLICATION_EXISTS',
          message: 'You have already submitted a beta application'
        }
      });
    }

    // Create beta application
    const application = new BetaApplication({
      userId: req.user.uid,
      name,
      email,
      company,
      role,
      useCase,
      experience,
      expectations,
      teamSize,
      timeline,
      status: 'pending',
      submittedAt: new Date()
    });

    await application.save();

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'RAG Prompt Library Beta Application Received',
      template: 'beta-application-confirmation',
      data: {
        name,
        applicationId: application._id
      }
    });

    // Notify admin team
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Beta Application Received',
      template: 'beta-application-admin-notification',
      data: {
        name,
        email,
        company,
        useCase,
        applicationId: application._id
      }
    });

    logger.info('Beta application submitted', {
      userId: req.user.uid,
      email,
      company,
      applicationId: application._id
    });

    res.status(201).json({
      message: 'Beta application submitted successfully',
      applicationId: application._id
    });
  } catch (error) {
    logger.error('Error submitting beta application:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit beta application'
      }
    });
  }
});

// Get user's beta application status
router.get('/applications/status', auth, async (req, res) => {
  try {
    const application = await BetaApplication.findOne({
      userId: req.user.uid
    });

    if (!application) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'No beta application found'
        }
      });
    }

    res.json({
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      notes: application.notes
    });
  } catch (error) {
    logger.error('Error fetching beta application status:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch application status'
      }
    });
  }
});

// Admin: List all beta applications
router.get('/admin/applications', auth, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search
    } = req.query;

    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await BetaApplication.find(filter)
      .sort({ submittedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await BetaApplication.countDocuments(filter);

    res.json({
      applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching beta applications:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch beta applications'
      }
    });
  }
});

// Admin: Review beta application
router.put('/admin/applications/:applicationId', auth, admin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await BetaApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Beta application not found'
        }
      });
    }

    // Update application
    application.status = status;
    application.notes = notes;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.uid;

    await application.save();

    // If approved, create beta user record
    if (status === 'approved') {
      const betaUser = new BetaUser({
        userId: application.userId,
        email: application.email,
        name: application.name,
        company: application.company,
        approvedAt: new Date(),
        approvedBy: req.user.uid,
        features: {
          advancedRAG: true,
          prioritySupport: true,
          betaFeatures: true,
          increasedLimits: true
        },
        limits: {
          monthlyExecutions: 10000,
          monthlyTokens: 1000000,
          maxDocuments: 1000,
          maxWorkspaces: 10
        }
      });

      await betaUser.save();

      // Send approval email
      await sendEmail({
        to: application.email,
        subject: 'Welcome to RAG Prompt Library Beta!',
        template: 'beta-approval',
        data: {
          name: application.name,
          loginUrl: `${process.env.FRONTEND_URL}/auth`
        }
      });

      logger.info('Beta application approved', {
        applicationId,
        userId: application.userId,
        email: application.email
      });
    } else if (status === 'rejected') {
      // Send rejection email
      await sendEmail({
        to: application.email,
        subject: 'RAG Prompt Library Beta Application Update',
        template: 'beta-rejection',
        data: {
          name: application.name,
          notes
        }
      });

      logger.info('Beta application rejected', {
        applicationId,
        userId: application.userId,
        email: application.email
      });
    }

    res.json({
      message: 'Application reviewed successfully',
      application
    });
  } catch (error) {
    logger.error('Error reviewing beta application:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to review application'
      }
    });
  }
});

// Admin: List beta users
router.get('/admin/users', auth, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search
    } = req.query;

    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const betaUsers = await BetaUser.find(filter)
      .sort({ approvedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await BetaUser.countDocuments(filter);

    res.json({
      betaUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching beta users:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch beta users'
      }
    });
  }
});

// Admin: Update beta user
router.put('/admin/users/:userId', auth, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { features, limits, notes } = req.body;

    const betaUser = await BetaUser.findOne({ userId });
    
    if (!betaUser) {
      return res.status(404).json({
        error: {
          code: 'BETA_USER_NOT_FOUND',
          message: 'Beta user not found'
        }
      });
    }

    // Update beta user
    if (features) betaUser.features = { ...betaUser.features, ...features };
    if (limits) betaUser.limits = { ...betaUser.limits, ...limits };
    if (notes) betaUser.notes = notes;

    betaUser.updatedAt = new Date();

    await betaUser.save();

    logger.info('Beta user updated', {
      userId,
      updatedBy: req.user.uid
    });

    res.json({
      message: 'Beta user updated successfully',
      betaUser
    });
  } catch (error) {
    logger.error('Error updating beta user:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update beta user'
      }
    });
  }
});

// Check if user is beta user
router.get('/status', auth, async (req, res) => {
  try {
    const betaUser = await BetaUser.findOne({ userId: req.user.uid });

    res.json({
      isBetaUser: !!betaUser,
      features: betaUser?.features || {},
      limits: betaUser?.limits || {}
    });
  } catch (error) {
    logger.error('Error checking beta status:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check beta status'
      }
    });
  }
});

// Submit beta feedback
router.post('/feedback', auth, async (req, res) => {
  try {
    const { category, rating, comment, feature, page } = req.body;

    // Check if user is beta user
    const betaUser = await BetaUser.findOne({ userId: req.user.uid, isActive: true });

    if (!betaUser) {
      return res.status(403).json({
        error: {
          code: 'NOT_BETA_USER',
          message: 'Only beta users can submit feedback'
        }
      });
    }

    // Add feedback to beta user record
    await betaUser.addFeedback({
      category,
      rating,
      comment,
      feature
    });

    // Send notification to admin team
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Beta Feedback: ${category} - Rating: ${rating}/5`,
      template: 'beta-feedback-notification',
      data: {
        userName: betaUser.name,
        userEmail: betaUser.email,
        category,
        rating,
        comment,
        feature,
        page,
        userId: req.user.uid
      }
    });

    logger.info('Beta feedback submitted', {
      userId: req.user.uid,
      category,
      rating,
      feature
    });

    res.status(201).json({
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting beta feedback:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit feedback'
      }
    });
  }
});

// Admin: Get beta feedback
router.get('/admin/feedback', auth, admin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      rating,
      startDate,
      endDate
    } = req.query;

    const filter: any = {};

    if (category) {
      filter['feedback.category'] = category;
    }

    if (rating) {
      filter['feedback.rating'] = Number(rating);
    }

    if (startDate || endDate) {
      filter['feedback.date'] = {};
      if (startDate) filter['feedback.date'].$gte = new Date(startDate as string);
      if (endDate) filter['feedback.date'].$lte = new Date(endDate as string);
    }

    const betaUsers = await BetaUser.find(
      { feedback: { $exists: true, $not: { $size: 0 } } },
      { name: 1, email: 1, company: 1, feedback: 1 }
    ).sort({ 'feedback.date': -1 });

    // Flatten feedback from all users
    const allFeedback = betaUsers.flatMap(user =>
      user.feedback.map(feedback => ({
        ...feedback.toObject(),
        userName: user.name,
        userEmail: user.email,
        userCompany: user.company,
        userId: user.userId
      }))
    );

    // Apply filters
    let filteredFeedback = allFeedback;

    if (category) {
      filteredFeedback = filteredFeedback.filter(f => f.category === category);
    }

    if (rating) {
      filteredFeedback = filteredFeedback.filter(f => f.rating === Number(rating));
    }

    if (startDate) {
      filteredFeedback = filteredFeedback.filter(f => new Date(f.date) >= new Date(startDate as string));
    }

    if (endDate) {
      filteredFeedback = filteredFeedback.filter(f => new Date(f.date) <= new Date(endDate as string));
    }

    // Sort by date (newest first)
    filteredFeedback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

    res.json({
      feedback: paginatedFeedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredFeedback.length,
        pages: Math.ceil(filteredFeedback.length / Number(limit))
      },
      summary: {
        totalFeedback: filteredFeedback.length,
        averageRating: filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / filteredFeedback.length || 0,
        categoryBreakdown: filteredFeedback.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    logger.error('Error fetching beta feedback:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch beta feedback'
      }
    });
  }
});

export default router;
