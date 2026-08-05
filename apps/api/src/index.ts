import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@/config/swagger';
import { connect } from '@/config/db';
import { initSocket } from '@/socket';

import authRouter from '@/routes/authRouter';
import userRouter from '@/routes/userRouter';
import conversationRouter from '@/routes/conversationRouter';
import messageRouter from '@/routes/messageRouter';
import friendRouter from '@/routes/friendRouter';
import uploadRouter from '@/routes/uploadRouter';
import attachmentRouter from '@/routes/attachmentRouter';
import notificationRouter from '@/routes/notificationRouter';
import searchRouter from '@/routes/searchRouter';
import reportRouter from '@/routes/reportRouter';
import adminRouter from '@/routes/adminRouter';
import pushRouter from '@/routes/pushRouter';
import storyRouter from '@/routes/storyRouter';
import monitoringRouter from '@/routes/monitoringRouter';
import { startPushWorker } from '@/workers/pushWorker';
import { httpRequestsTotal } from '@/config/metrics';

const PORT = process.env.API_PORT || process.env.PORT || 5000;

const app = express();
connect();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes`
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/friends', friendRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/attachments', attachmentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', adminRouter);
app.use('/api/push', pushRouter);
app.use('/api/stories', storyRouter);
app.use('/api', monitoringRouter);

const server = http.createServer(app);
initSocket(server);
startPushWorker();

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
});
