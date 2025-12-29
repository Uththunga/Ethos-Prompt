/**
 * Quotation Admin API Cloud Functions
 * Provides list, get, and update operations for quotation management
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firestore
const db = admin.firestore();

// Quotation status type
type QuotationStatus = 'pending' | 'reviewed' | 'quoted' | 'converted' | 'declined';

// Valid status values
const VALID_STATUSES: QuotationStatus[] = ['pending', 'reviewed', 'quoted', 'converted', 'declined'];

/**
 * Verify Firebase auth token
 */
async function verifyAuth(req: functions.https.Request): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    console.error('Auth verification failed:', e);
    return null;
  }
}

/**
 * List quotations with optional filters
 * GET /adminListQuotations?status=pending&service=smart-assistant&dateRange=7d&page=1
 */
export const adminListQuotations = functions
  .region('australia-southeast1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    // Verify auth
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      // Parse query params
      const status = req.query.status as string | undefined;
      const service = req.query.service as string | undefined;
      const dateRange = req.query.dateRange as string | undefined;
      const assignedTo = req.query.assignedTo as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      // Build query
      let query: admin.firestore.Query = db.collection('quotation_requests');

      // Apply filters
      if (status && VALID_STATUSES.includes(status as QuotationStatus)) {
        query = query.where('status', '==', status);
      }

      if (service) {
        query = query.where('serviceContext', '==', service);
      }

      if (assignedTo === 'unassigned') {
        query = query.where('assignedTo', '==', null);
      } else if (assignedTo) {
        query = query.where('assignedTo', '==', assignedTo);
      }

      // Date range filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate));
      }

      // Order by created date descending
      query = query.orderBy('createdAt', 'desc');

      // Pagination
      const offset = (page - 1) * pageSize;
      query = query.offset(offset).limit(pageSize);

      // Execute query
      const snapshot = await query.get();

      const quotations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        quotations,
        page,
        pageSize,
      });
    } catch (error: any) {
      console.error('Error listing quotations:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

/**
 * Get a single quotation by ID
 * GET /adminGetQuotation?id=xxx
 */
export const adminGetQuotation = functions
  .region('australia-southeast1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    // Verify auth
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const id = req.query.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID is required' });
        return;
      }

      const doc = await db.collection('quotation_requests').doc(id).get();

      if (!doc.exists) {
        res.status(404).json({ success: false, error: 'Quotation not found' });
        return;
      }

      res.status(200).json({
        success: true,
        quotation: {
          id: doc.id,
          ...doc.data(),
        },
      });
    } catch (error: any) {
      console.error('Error getting quotation:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

/**
 * Update quotation status, assignment, or notes
 * PATCH /adminUpdateQuotation
 * Body: { id, status?, assignedTo?, assignedToName?, internalNotes? }
 */
export const adminUpdateQuotation = functions
  .region('australia-southeast1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'PATCH') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    // Verify auth
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const { id, status, assignedTo, assignedToName, internalNotes } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'ID is required' });
        return;
      }

      // Validate status if provided
      if (status && !VALID_STATUSES.includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      // Build update object
      const updates: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: decodedToken.uid,
      };

      if (status) {
        updates.status = status;
        // Set converted/quoted timestamps
        if (status === 'converted') {
          updates.convertedAt = admin.firestore.FieldValue.serverTimestamp();
        } else if (status === 'quoted') {
          updates.quotedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      }

      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (assignedToName !== undefined) updates.assignedToName = assignedToName;
      if (internalNotes !== undefined) updates.internalNotes = internalNotes;

      // Update document
      const docRef = db.collection('quotation_requests').doc(id);
      await docRef.update(updates);

      // Fetch updated document
      const doc = await docRef.get();

      res.status(200).json({
        success: true,
        quotation: {
          id: doc.id,
          ...doc.data(),
        },
      });
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

/**
 * Get quotation statistics
 * GET /adminQuotationStats
 */
export const adminQuotationStats = functions
  .region('australia-southeast1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Verify auth
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      // Count by status
      const collection = db.collection('quotation_requests');

      const [totalSnap, pendingSnap, quotedSnap, convertedSnap] = await Promise.all([
        collection.count().get(),
        collection.where('status', '==', 'pending').count().get(),
        collection.where('status', '==', 'quoted').count().get(),
        collection.where('status', '==', 'converted').count().get(),
      ]);

      const total = totalSnap.data().count;
      const pending = pendingSnap.data().count;
      const quoted = quotedSnap.data().count;
      const converted = convertedSnap.data().count;

      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

      res.status(200).json({
        success: true,
        total,
        pending,
        quoted,
        converted,
        conversionRate,
      });
    } catch (error: any) {
      console.error('Error getting stats:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });
