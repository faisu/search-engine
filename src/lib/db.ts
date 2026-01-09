import { Client } from 'pg';

// Database connection string - must be set in environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Query helper function - creates a new connection for each query (serverless-friendly)
export async function query(text: string, params?: any[]) {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    const result = await client.query(text, params);
    await client.end();
    return result;
  } catch (error) {
    await client.end().catch(() => {});
    console.error('Database query error:', error);
    throw error;
  }
}

