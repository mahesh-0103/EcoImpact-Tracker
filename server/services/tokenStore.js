
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// This implementation is NOT suitable for production at scale.
// It's a simple file-based store for a single-server environment.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjusted to be in a more common writable directory if possible, or project root.
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/var/data/token_db.json' 
  : path.join(__dirname, '..', '..', 'token_db.json');

// --- No more in-memory cache --- 

async function readDb() {
  try {
    await fs.access(DB_PATH);
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, which is fine. Return an empty DB.
      return {};
    }
    // For other errors, log and re-throw
    console.error('[TokenStore] Error reading database file:', error);
    throw error;
  }
}

async function writeDb(db) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('[TokenStore] Error writing to database file:', error);
    throw error;
  }
}

/**
 * Saves a token for a given user and provider.
 * @param {string} userId - The unique ID of the user.
 * @param {string} provider - The name of the provider (e.g., 'google', 'slack').
 * @param {object} tokenData - The token data to save.
 */
async function saveToken(userId, provider, tokenData) {
  const db = await readDb();
  if (!db[userId]) {
    db[userId] = {};
  }
  db[userId][provider] = tokenData;
  await writeDb(db);
}

/**
 * Retrieves a token for a given user and provider.
 * @param {string} userId - The unique ID of the user.
 * @param {string} provider - The name of the provider.
 * @returns {Promise<object|null>} The token data or null if not found.
 */
async function getToken(userId, provider) {
  const db = await readDb();
  return db[userId]?.[provider] || null;
}

/**
 * Deletes a token for a given user and provider.
 * @param {string} userId - The unique ID of the user.
 * @param {string} provider - The name of the provider.
 */
async function deleteToken(userId, provider) {
  const db = await readDb();
  if (db[userId]?.[provider]) {
    delete db[userId][provider];
    if (Object.keys(db[userId]).length === 0) {
      delete db[userId];
    }
    await writeDb(db);
  }
}

export default {
  saveToken,
  getToken,
  deleteToken,
};
