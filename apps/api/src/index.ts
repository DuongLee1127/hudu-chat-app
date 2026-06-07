import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connect } from './config/db';

dotenv.config();

const app = express();

connect();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Backend Node.js TypeScript is running',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
