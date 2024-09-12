import express from 'express';
import { MongoClient } from 'mongodb';
import healthHistoryRouter from './api/health-history/route';
import { ensureMockDataInDatabase } from './lib/generateMockData';

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/healthhistory';

let db: any;

async function connectToDatabase() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    
    // Ensure mock data is in the database
    await ensureMockDataInDatabase(db);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

connectToDatabase().catch(console.error);

app.use(express.json());
app.use('/api/health-history', (req, res, next) => {
  (req as any).db = db;
  next();
}, healthHistoryRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});