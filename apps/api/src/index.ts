import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@/config/swagger';
import { connect } from '@/config/db';
import authRouter from '@/routes/authRouter';

const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();
connect();

app.use(cors());
app.use(express.json());

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes`
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
});
