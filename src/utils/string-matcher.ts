import { japanAddressRegExp } from '@/utils/regexp-components';

const japanAddressRegexp = japanAddressRegExp('g');

export function matchJapanAddress(text: string): string[] {
  return text.match(japanAddressRegexp) || [];
}
