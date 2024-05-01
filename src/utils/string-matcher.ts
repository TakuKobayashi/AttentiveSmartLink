import { japanAddressRegExp, urlRegExp } from '@/utils/regexp-components';

const japanAddressRegexp = japanAddressRegExp('g');
const urlRegexp = urlRegExp('g');

export function matchJapanAddress(text: string): string[] {
  return text.match(japanAddressRegexp) || [];
}

export function matchHttpUrl(text: string): string[] {
  return text.match(urlRegexp) || [];
}
