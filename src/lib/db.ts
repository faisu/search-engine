import { Client } from 'pg';

// Query helper function - creates a new connection for each query (serverless-friendly)
export async function query(text: string, params?: any[]) {
  // Get connection string at runtime (not at module load time)
  // This prevents build-time errors when DATABASE_URL is not available
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in your environment variables.');
  }

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

