import express, { NextFunction, Request, Response } from 'express';
import { messagingApi, middleware, TextMessage } from '@line/bot-sdk';
const { MessagingApiClient } = messagingApi;

const lineBotRouter = express.Router();

const config = {
  channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESSTOKEN,
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET,
};

const client = new MessagingApiClient(config);

lineBotRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('hello line');
});

lineBotRouter.post('/message', middleware(config), async (req: Request, res: Response, next: NextFunction) => {
  console.log(JSON.stringify(req.body));
  const result = await Promise.all(req.body.events.map(async (event) => handleEvent(event))).catch((err) => {
    console.error(err);
    res.status(200).end();
    Promise.reject(err);
  });
  res.json(result);
});

async function handleEvent(event) {
  if (event.type === 'follow') {
    const profile = await client.getProfile(event.source.userId);
    console.log(profile);
    return Promise.resolve(null);
  } else if (event.type === 'unfollow') {
    return Promise.resolve(null);
  } else if (event.type === 'message') {
    if (event.message.type === 'text') {
      const echo: TextMessage = { type: 'text', text: event.message.text };
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [echo],
      });
    } else if (event.message.type === 'location') {
      return Promise.resolve(null);
    } else if (event.message.type === 'sticker') {
      const echo: TextMessage = { type: 'text', text: 'sticker message received' };
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [echo],
      });
    }
  }
}

export { lineBotRouter };
