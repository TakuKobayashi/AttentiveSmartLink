import { japanAddressRegExp, urlRegExp } from '@/utils/regexp-components';
import { convertLocationObjectFromAddress, LocationInfo } from '@/utils/geocoding';

import { load } from 'cheerio';
import { uniq } from 'lodash';
const ogs = require('open-graph-scraper');

const japanAddressRegexp = japanAddressRegExp('g');
const urlRegexp = urlRegExp('g');

export function matchJapanAddress(text: string): string[] {
  return text.match(japanAddressRegexp) || [];
}

export function matchHttpUrl(text: string): string[] {
  return text.match(urlRegexp) || [];
}

export async function searchAndConvertLocationInfosFromText(text: string): Promise<LocationInfo[]> {
  const japanAddresses: string[] = uniq(matchJapanAddress(text).map((addressString) => addressString.trim().split(' ')[0]));
  const locationInfos = await Promise.all(japanAddresses.map((japanAddress) => convertLocationObjectFromAddress(japanAddress)));
  return locationInfos;
}

export async function searchUrlAndLoadLocationInfos(text: string): Promise<LocationInfo[]> {
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
