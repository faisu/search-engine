import { Client } from 'pg';

// Database connection string
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_3ReFIJC9cGXy@ep-dark-bird-adq3eh0o-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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

