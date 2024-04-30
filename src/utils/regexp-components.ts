export const todoufukenList: string[] = [
  '北海道',
  '青森県',
  '岩手県',
  '秋田県',
  '山形県',
  '宮城県',
  '福島県',
  '群馬県',
  '栃木県',
  '茨城県',
  '埼玉県',
  '東京都',
  '千葉県',
  '神奈川県',
  '新潟県',
  '長野県',
  '富山県',
  '石川県',
  '福井県',
  '静岡県',
  '山梨県',
  '愛知県',
  '岐阜県',
  '滋賀県',
  '三重県',
  '奈良県',
  '和歌山県',
  '京都府',
  '大阪府',
  '兵庫県',
  '岡山県',
  '広島県',
  '鳥取県',
  '島根県',
  '山口県',
  '香川県',
  '徳島県',
  '高知県',
  '愛媛県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '大分県',
  '熊本県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

export function japanAddressRegExp(flags: string = ''): RegExp {
  return new RegExp(
    '(' +
      todoufukenList.join('|') +
      ')' +
      '((?:旭川|伊達|石狩|盛岡|奥州|田村|南相馬|那須塩原|東村山|武蔵村山|羽村|十日町|上越|富山|野々市|大町|蒲郡|四日市|姫路|大和郡山|廿日市|下松|岩国|田川|大村|宮古|富良野|別府|佐伯|黒部|小諸|塩尻|玉野|周南)市|(?:余市|高市|[^市]{2,3}?)郡(?:玉村|大町|.{1,5}?)[町村]|(?:.{1,4}市)?[^町]{1,4}?区|.{1,7}?[市町村])' +
      '(.+)',
    flags,
  );
}

export const yearRegExpPart = `(\/|-|年)`;
export const monthRegExpPart = `(\/|-|月)`;
export const dayRegExpPart = `日`;

export function urlRegExp(flags: string = ''): RegExp {
  return new RegExp("(https?|ftp)(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+)", flags);
}
