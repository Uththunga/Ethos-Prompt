import * as admin from 'firebase-admin';

export const db = admin.firestore();

export * from './config';
export * from './contactActivitiesRepository';
export * from './contactsRepository';
export * from './models';
