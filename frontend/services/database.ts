import * as SQLite from 'expo-sqlite';

// Define the database name. This will be the name of the .db file on the device.
const DATABASE_NAME = 'truman.db';

// Define the database type
type Database = SQLite.SQLiteDatabase;
type SQLiteCallback = (transaction: Database, result: any) => void;
type SQLiteErrorCallback = (transaction: Database, error: Error) => boolean;

/**
 * Opens or creates the SQLite database.
 * This function should be called before any database transactions.
 * @returns {Database} The database object.
 */
const getDb = async (): Promise<Database> => {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
};

// --- Database Schema Interfaces ---

/**
 * Interface for a Message record in the SQLite database.
 */
export interface DbMessage {
  id: string;
  sender: string;
  time: string;
  content: string;
  category: 'Critical' | 'High' | 'Normal';
}

/**
 * Interface for a Peer record in the SQLite database.
 */
export interface DbPeer {
  id: string;
  responseTime: number;
  isOnline: 0 | 1;
}

/**
 * Interface for a Whitelisted Peer record in the SQLite database.
 */
export interface DbWhitelistedPeer {
  id: string;
}

/**
 * Initializes the database by creating tables if they do not already exist.
 */
export const setupDatabase = async () => {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      sender TEXT NOT NULL,
      time TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS peers (
      id TEXT PRIMARY KEY NOT NULL,
      responseTime INTEGER NOT NULL,
      isOnline INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whitelisted_peers (
      id TEXT PRIMARY KEY NOT NULL
    );
  `);
};

// --- CRUD Operations for Messages ---

export const addMessage = async (message: DbMessage) => {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO messages (id, sender, time, content, category) VALUES (?, ?, ?, ?, ?)',
    [message.id, message.sender, message.time, message.content, message.category]
  );
  return result;
};

export const getMessages = async (category: DbMessage['category'] | 'All' = 'All'): Promise<DbMessage[]> => {
  const db = await getDb();
  
  let query = 'SELECT * FROM messages';
  const params: string[] = [];

  if (category && category !== 'All') {
    query += ' WHERE category = ?';
    params.push(category);
  }
  query += ' ORDER BY time DESC';

  return await db.getAllAsync<DbMessage>(query, params);
};

// --- CRUD Operations for Peers ---

export const addOrUpdatePeer = async (peer: DbPeer) => {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO peers (id, responseTime, isOnline) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET responseTime = EXCLUDED.responseTime, isOnline = EXCLUDED.isOnline`,
    [peer.id, peer.responseTime, peer.isOnline]
  );
  return result;
};

export const getPeers = async (): Promise<DbPeer[]> => {
  const db = await getDb();
  return await db.getAllAsync<DbPeer>('SELECT * FROM peers');
};

export const deletePeer = async (id: string) => {
  const db = await getDb();
  const result = await db.runAsync('DELETE FROM peers WHERE id = ?', [id]);
  return result;
};

// --- CRUD Operations for Whitelisted Peers ---

export const addWhitelistedPeer = async (peerId: string) => {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO whitelisted_peers (id) VALUES (?)',
    [peerId]
  );
  return result;
};

export const removeWhitelistedPeer = async (peerId: string) => {
  const db = await getDb();
  const result = await db.runAsync(
    'DELETE FROM whitelisted_peers WHERE id = ?',
    [peerId]
  );
  return result;
};

export const getWhitelistedPeers = async (): Promise<DbWhitelistedPeer[]> => {
  const db = await getDb();
  return await db.getAllAsync<DbWhitelistedPeer>('SELECT * FROM whitelisted_peers');
};
