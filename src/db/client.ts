import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('taskalert.db');

// SQLite no aplica las claves foráneas (ni ON DELETE CASCADE) si no se activan.
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
