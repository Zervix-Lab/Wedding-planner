import mongoose from "mongoose";

// Cache the connection on globalThis so hot reloads (dev) and warm serverless
// invocations (Vercel) reuse one connection instead of opening a new one per request.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
const g = globalThis as unknown as { _mongooseCache?: MongooseCache };
const cache: MongooseCache = (g._mongooseCache ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  cache.promise ??= mongoose
    .connect(uri, { bufferCommands: false, maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
    .catch((err) => {
      cache.promise = null; // allow retry on next request
      throw err;
    });
  cache.conn = await cache.promise;
  return cache.conn;
}
