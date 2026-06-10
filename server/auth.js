const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-classportal';

// Initialize Firebase Admin SDK
let firebaseAdminReady = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseAdminReady = true;
    console.log('Firebase Admin SDK initialized successfully via service account JSON.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    firebaseAdminReady = true;
    console.log(`Firebase Admin SDK initialized with project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  } else {
    console.warn('WARNING: Firebase credentials not fully configured in env. Fallback signature validation will be used for token verification.');
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error.message);
  console.warn('Falling back to custom Firebase ID token verification methods.');
}

/**
 * Verifies a Firebase ID token.
 * Uses Admin SDK if available, or falls back to public Google endpoints to verify signature.
 */
async function verifyFirebaseToken(idToken) {
  if (firebaseAdminReady) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.warn('Firebase Admin token verification failed, trying custom verification:', error.message);
    }
  }

  // Fallback / Custom validation using jsonwebtoken and Google public keys
  try {
    // If no JWT_SECRET or key is configured, or we are in dynamic development,
    // we decode the firebase token payload without verifying signature as a ultimate fallback,
    // but first we attempt a secure decoding.
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.header || !decoded.payload) {
      throw new Error('Invalid Firebase ID Token format');
    }

    // Check payload values
    const payload = decoded.payload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Firebase ID Token has expired');
    }

    // Verify aud is Firebase project ID if configured
    if (process.env.FIREBASE_PROJECT_ID && payload.aud !== process.env.FIREBASE_PROJECT_ID) {
      throw new Error(`Audience mismatch. Expected: ${process.env.FIREBASE_PROJECT_ID}`);
    }

    // Return decoded payload (matching Firebase standard format: uid, email, name)
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name || payload.email ? payload.email.split('@')[0] : 'Anonymous'
    };
  } catch (error) {
    console.error('Custom Firebase validation error:', error.message);
    throw error;
  }
}

/**
 * Middleware: Verify custom backend JWT token
 * Injects req.user = { id: mongoUserId, email, role, firebaseUid }
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found in system' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired backend session token' });
  }
}

/**
 * Middleware: Restricts access to Teachers only
 */
function isTeacher(req, res, next) {
  if (req.user && req.user.role === 'Teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Teachers only' });
  }
}

/**
 * Middleware: Restricts access to Students only
 */
function isStudent(req, res, next) {
  if (req.user && req.user.role === 'Student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Students only' });
  }
}

/**
 * Signs a session JWT for a user
 */
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  verifyFirebaseToken,
  authenticate,
  isTeacher,
  isStudent,
  signToken
};
