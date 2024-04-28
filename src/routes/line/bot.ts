import express, { NextFunction, Request, Response } from 'express';

import { convertLocationObjectFromAddress } from '@/utils/geocoding';
import { matchJapanAddress } from '@/utils/string-matcher';
import { groupJoinedMessage } from '@/utils/message-texts';
import { Message, messagingApi, middleware } from '@line/bot-sdk';
import { compact } from 'lodash';
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
  if (event.type === 'join') {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: groupJoinedMessage,
        },
      ],
    });
  } else if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  const japanAddresses: string[] = matchJapanAddress(event.message.text.match);
  const locationInfos = await Promise.all(japanAddresses.map((japanAddress) => convertLocationObjectFromAddress(japanAddress)));
  const responseMessages: Message[] = [];
  for (const locationInfo of compact(locationInfos)) {
    responseMessages.push({
      type: 'location',
      title: locationInfo.title,
      address: locationInfo.address,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
    });
    const gooogleMapUrl = new URL('https://www.google.com/maps/search/');
    const queryParams = new URLSearchParams({ api: '1', query: locationInfo.title });
    gooogleMapUrl.search = queryParams.toString();
    responseMessages.push({
      type: 'text',
      text: `Google Map\n${gooogleMapUrl.href}`,
    });
  }

  if (responseMessages.length > 0) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: responseMessages,
    });
  } else {
    return Promise.resolve(null);
  }
}

export { lineBotRouter };
