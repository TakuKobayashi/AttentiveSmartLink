import express, { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import { japanAddressRegExp } from '@/utils/regexp-components';
import { LocationMessage, messagingApi, middleware, TextMessage } from '@line/bot-sdk';
const { MessagingApiClient } = messagingApi;

const lineBotRouter = express.Router();

const config = {
  channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESSTOKEN,
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET,
};

const client = new MessagingApiClient(config);

const japanAddressRegexp = japanAddressRegExp('g');

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
      const japanAddresses = event.message.text.match(japanAddressRegexp) || [];
      const responses = await Promise.all(
        japanAddresses.map((japanAddress: string) =>
          axios.get('https://map.yahooapis.jp/geocode/V1/geoCoder', {
            params: { appid: process.env.YAHOO_API_CLIENT_ID, query: japanAddress, output: 'json' },
          }),
        ),
      );
      const responseLocationMessages: LocationMessage[] = [];
      for (const response of responses) {
        const gecodeData = response.data;
        const feature = (gecodeData.Feature || [])[0];
        if (feature) {
          const [lon, lat] = feature.Geometry.Coordinates.split(',');
          responseLocationMessages.push({
            type: 'location',
            title: feature.Name,
            address: feature.Property.Address,
            latitude: lat,
            longitude: lon,
          });
        }
      }

      if (responseLocationMessages.length > 0) {
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: responseLocationMessages,
        });
      } else {
        return Promise.resolve(null);
      }
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
