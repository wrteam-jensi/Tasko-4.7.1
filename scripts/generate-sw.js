import dotenv from 'dotenv';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from multiple files (Next.js convention)
// Priority: .env.local > .env (later loads override earlier)
const envFiles = [
  join(__dirname, '..', '.env'),
  join(__dirname, '..', '.env.local'),
];

envFiles.forEach(file => {
  if (existsSync(file)) {
    dotenv.config({ path: file });
  }
});

// Read Firebase config token for API authentication
// This token is used to secure the /api/sw-init endpoint
const firebaseConfigToken = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_TOKEN;

if (!firebaseConfigToken) {
  console.error('❌ Error: FIREBASE_CONFIG_TOKEN environment variable is missing');
  console.error('   This token is required to secure the Firebase config API endpoint.');
  console.error('   Generate a random token and add it to your .env file:');
  console.error('   FIREBASE_CONFIG_TOKEN=your-random-token-here');
  console.error('\n   You can generate a token using:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Read required Firebase environment variables (for validation only)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGEING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESUMENT_ID,
};

// Validate that all required environment variables are present
const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingVars.forEach((key) => {
    console.error(`   - ${key}`);
  });
  console.error('\nPlease ensure all Firebase config variables are set in .env');
  process.exit(1);
}

// Check if we are in "Server/SEO" mode or "Static" mode
const isSeoEnabled = process.env.NEXT_PUBLIC_ENABLE_SEO === 'true';

let initializationBlock = '';
let modeInfo = '';

if (isSeoEnabled) {
  // SERVER MODE: Fetch config from API (Secure/Obfuscated)
  modeInfo = 'Server Mode (SEO Enabled) - API Fetched Config';
  initializationBlock = `// Firebase instance - initialized dynamically
let messaging = null;
let isInitialized = false;

async function initializeFirebase() {
  if (isInitialized) return;
  
  try {
    const token = "${firebaseConfigToken}";
    const requestTime = Date.now();
    const clientId = btoa(Date.now().toString() + Math.random().toString()).substring(0, 16);
    
    // Fetch config from secure API endpoint
    const response = await fetch('/api/sw-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
        'X-Request-Time': requestTime.toString(),
        'X-Service-Worker': 'true',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'init',
        clientId: clientId,
        timestamp: requestTime
      }),
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
        throw new Error(\`Failed to fetch config: \${response.status}\`);
    }
    
    const firebaseConfig = await response.json();
    
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    isInitialized = true;
    console.log('🔥 [SW] Firebase initialized (Server Mode)');
  } catch (error) {
    console.error('🔥 [SW] Error initializing Firebase:', error);
    setTimeout(initializeFirebase, 5000);
  }
}

initializeFirebase();`;
} else {
  // STATIC MODE: Embed config directly (Public keys are safe in client code)
  modeInfo = 'Static Mode (SEO Disabled) - Embedded Config';
  initializationBlock = `// Initialize immediately
const firebaseConfig = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGEING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
  measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MESUMENT_ID}"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('🔥 [SW] Firebase initialized (Static Mode)');`;
}

// Read the unified template file
const templatePath = join(__dirname, 'sw-template.js');
let templateContent = '';

try {
  templateContent = readFileSync(templatePath, 'utf8');
} catch (err) {
  console.error("❌ Error: Could not read template file 'sw-template.js'");
  console.error(err.message);
  process.exit(1);
}

// Inject mode and initialization code
let finalSwContent = templateContent
  .replace('{{MODE_INFO}}', modeInfo)
  .replace('{{FIREBASE_INIT}}', initializationBlock);

// Write the generated file to public/firebase-messaging-sw.js
const outputPath = join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
writeFileSync(outputPath, finalSwContent, 'utf8');

console.log('✅ Successfully generated firebase-messaging-sw.js from template');
if (isSeoEnabled) {
  console.log('   - Mode: Server (SEO Enabled)');
  console.log('   - Config: Fetched securely from API');
} else {
  console.log('   - Mode: Static (SEO Disabled)');
  console.log('   - Config: Embedded directly in SW');
}
console.log('   - Status: Ready for production');
