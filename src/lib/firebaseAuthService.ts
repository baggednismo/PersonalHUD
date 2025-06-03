import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();

/**
 * Creates a new user in Firebase Authentication with email and password.
 * @param email The user's email address.
 * @param password The user's password.
 * @returns A promise that resolves with the user record.
 */
export const createUserWithEmailAndPassword = async (email: string, password: string): Promise<admin.auth.UserRecord> => {
  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
    });
    return userRecord;
  } catch (error) {
    console.error('Error creating user with email and password:', error);
    throw error;
  }
};

/**
 * Creates a new user in Firebase Authentication with a user object.
 * @param user The user object containing properties like email, password, displayName, etc.
 * @returns A promise that resolves with the user record.
 */
export const createUser = async (user: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> => {
  try {
    const userRecord = await auth.createUser(user);
    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};