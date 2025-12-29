/**
 * Seed Script: Create Email Templates and Sequence for Quotation Follow-Up
 *
 * Run this script once to populate Firestore with the email templates and sequence.
 *
 * Usage:
 *   npx ts-node src/scripts/seedQuotationEmailSequence.ts
 *
 * Or run via Firebase Functions shell:
 *   firebase functions:shell
 *   > seedQuotationSequence()
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

import {
    quotationSequenceConfig,
    quotationSequenceTemplates,
} from '../contactManagement/emailTemplates/quotationSequence';

/**
 * Seed email templates and create sequence
 */
async function seedQuotationEmailSequence(): Promise<void> {
  console.log('🚀 Starting quotation email sequence seed...\n');

  const templatesCollection = db.collection('email_templates');
  const sequencesCollection = db.collection('email_sequences');

  const now = admin.firestore.FieldValue.serverTimestamp();
  const templateIds: string[] = [];

  // Step 1: Create email templates
  console.log('📧 Creating email templates...');

  for (let i = 0; i < quotationSequenceTemplates.length; i++) {
    const template = quotationSequenceTemplates[i];

    // Check if template already exists by name
    const existingSnap = await templatesCollection
      .where('name', '==', template.name)
      .limit(1)
      .get();

    let templateId: string;

    if (!existingSnap.empty) {
      templateId = existingSnap.docs[0].id;
      console.log(`  ⏭️  Template "${template.name}" already exists (${templateId}), updating...`);

      await templatesCollection.doc(templateId).update({
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        description: template.description,
        type: template.type,
        updatedAt: now,
      });
    } else {
      const docRef = await templatesCollection.add({
        name: template.name,
        description: template.description,
        type: template.type,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        isActive: true,
        createdByUserId: 'system',
        createdAt: now,
        updatedAt: now,
      });
      templateId = docRef.id;
      console.log(`  ✅ Created template "${template.name}" (${templateId})`);
    }

    templateIds.push(templateId);
  }

  // Step 2: Create or update the email sequence
  console.log('\n📋 Creating email sequence...');

  const existingSeqSnap = await sequencesCollection
    .where('name', '==', quotationSequenceConfig.name)
    .limit(1)
    .get();

  const sequenceSteps = [
    { stepNumber: 1, templateId: templateIds[0], waitDays: 0 },  // Day 0: Confirmation
    { stepNumber: 2, templateId: templateIds[1], waitDays: 3 },  // Day 3: Value Reminder
    { stepNumber: 3, templateId: templateIds[2], waitDays: 4 },  // Day 7: Final Follow-Up (3+4=7)
  ];

  let sequenceId: string;

  if (!existingSeqSnap.empty) {
    sequenceId = existingSeqSnap.docs[0].id;
    console.log(`  ⏭️  Sequence "${quotationSequenceConfig.name}" already exists (${sequenceId}), updating...`);

    await sequencesCollection.doc(sequenceId).update({
      description: quotationSequenceConfig.description,
      isActive: quotationSequenceConfig.isActive,
      steps: sequenceSteps,
      updatedAt: now,
    });
  } else {
    const seqRef = await sequencesCollection.add({
      name: quotationSequenceConfig.name,
      description: quotationSequenceConfig.description,
      isActive: quotationSequenceConfig.isActive,
      steps: sequenceSteps,
      createdByUserId: 'system',
      createdAt: now,
      updatedAt: now,
    });
    sequenceId = seqRef.id;
    console.log(`  ✅ Created sequence "${quotationSequenceConfig.name}" (${sequenceId})`);
  }

  // Step 3: Output the sequence ID for .env configuration
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Seed complete!\n');
  console.log('Add this to your functions/.env file:');
  console.log(`  DEFAULT_SEQUENCE_QUOTATION=${sequenceId}`);
  console.log('='.repeat(60) + '\n');

  return;
}

// Export for Firebase Functions shell
export { seedQuotationEmailSequence };

// Run directly if executed as script
if (require.main === module) {
  seedQuotationEmailSequence()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding:', error);
      process.exit(1);
    });
}
