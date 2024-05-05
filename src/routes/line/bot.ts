import express, { NextFunction, Request, Response } from 'express';

import { searchUrlAndLoadLocationInfos, searchAndConvertLocationInfosFromText } from '@/utils/utils';
import { groupJoinedMessage } from '@/utils/message-texts';
import { Message, messagingApi, middleware } from '@line/bot-sdk';
import { compact } from 'lodash';
const { MessagingApiClient } = messagingApi;
const ogs = require('open-graph-scraper');

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
  const normarizeText = event.message.text.normalize('NFKC');
  const locationInfos = await searchAndConvertLocationInfosFromText(normarizeText);
  const locationInfosFromUrl = await searchUrlAndLoadLocationInfos(normarizeText);
  const responseMessages: Message[] = [];
  for (const locationInfo of compact(locationInfos.concat(locationInfosFromUrl))) {
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
    const googleMapOgs = await ogs({ url: gooogleMapUrl.href });
    const ogImage = googleMapOgs.result.ogImage[0] || {};
    if (ogImage.url) {
      responseMessages.push({
        type: 'template',
        altText: locationInfo.title,
        template: {
          type: 'buttons',
          thumbnailImageUrl: ogImage.url,
          title: 'Google Mapで表示します',
          text: locationInfo.title,
          actions: [
            {
              type: 'uri',
              label: 'Google Mapで見る',
              uri: gooogleMapUrl.href,
            },
          ],
        },
      });
    }
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
