// PROVIDED STUB — do not modify.
//
// The real service's Mongo access layer, reduced to just the shared-connection behavior
// your repositories depend on (index maintenance omitted — not your concern here). The
// acceptance suites mock this module, so it is only exercised under `npm run dev`.
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_NAME || 'playbook';

let dbPromise: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = connect().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function connect(): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(dbName);
}
