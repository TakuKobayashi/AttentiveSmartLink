import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import { lineBotRouter } from './routes/line/bot';
import cors from 'cors';

const app = express();
app.use(cors());
app.use('/line/bot', lineBotRouter);

app.get('/test', (request, response) => {
  response.json({ hello: 'world' });
});

export const handler = serverlessExpress({ app });
