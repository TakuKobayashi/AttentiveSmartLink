import express, { NextFunction, Request, Response } from 'express';
import { load } from 'cheerio';

import { convertLocationObjectFromAddress, LocationInfo } from '@/utils/geocoding';
import { matchJapanAddress, matchHttpUrl } from '@/utils/string-matcher';
import { groupJoinedMessage } from '@/utils/message-texts';
import { Message, messagingApi, middleware } from '@line/bot-sdk';
import { compact, uniq } from 'lodash';
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
  console.log(JSON.stringify(req.body));
  const result = await Promise.all(req.body.events.map(async (event) => handleEvent(event))).catch((err) => {
    console.error(err);
    res.status(200).end();
    Promise.reject(err);
  });
  res.json(result);
});

async function searchAndConvertLocationInfosFromText(text: string): Promise<LocationInfo[]> {
  const japanAddresses: string[] = uniq(matchJapanAddress(text).map((addressString) => addressString.trim().split(' ')[0]));
  const locationInfos = await Promise.all(japanAddresses.map((japanAddress) => convertLocationObjectFromAddress(japanAddress)));
  return locationInfos;
}

async function searchUrlAndLoadLocationInfos(text: string): Promise<LocationInfo[]> {
  const urlStrings = uniq(matchHttpUrl(text));
  const urlOgpResults = await Promise.all(urlStrings.map((urlString) => ogs({ url: urlString })));
  const locationInfosPromises = [];
  for (const urlOgpResult of urlOgpResults) {
    // 投稿されたURLがGoogle Mapsだったならばスルー
    if (urlOgpResult.error || urlOgpResult.response.url.includes('https://www.google.com/maps')) {
      continue;
    }
    const $ = load(urlOgpResult.html.normalize('NFKC'));
    locationInfosPromises.push(searchAndConvertLocationInfosFromText($('body').text()));
  }
  const locationInfos = await Promise.all(locationInfosPromises);
  return locationInfos.flat();
}

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
    responseMessages.push({
      type: 'text',
      text: `Google Map\n${gooogleMapUrl.href}`,
      quoteText: event.message.quoteToken,
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
