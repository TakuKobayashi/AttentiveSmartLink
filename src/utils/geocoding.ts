import axios from 'axios';

export interface LocationInfo {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function convertLocationObjectFromAddress(address: string): Promise<LocationInfo | null> {
  const response = await axios.get('https://map.yahooapis.jp/geocode/V1/geoCoder', {
    params: { appid: process.env.YAHOO_API_CLIENT_ID, query: address, output: 'json' },
  });
  const gecodeData = response.data;
  const feature = (gecodeData.Feature || [])[0];
  if (feature) {
    const [lon, lat] = feature.Geometry.Coordinates.split(',');
    return {
      title: feature.Name,
      address: feature.Property.Address,
      latitude: lat,
      longitude: lon,
    };
  }
  return convertLocationObjectUseGsiFromAddress(address);
}

export async function convertLocationObjectUseGsiFromAddress(address: string): Promise<LocationInfo | null> {
  // https://msearch.gsi.go.jp/address-search/AddressSearch は国土地理院のジオサーチAPI
  const response = await axios.get('https://msearch.gsi.go.jp/address-search/AddressSearch', {
    params: { q: address },
  });
  const gecodeData = response.data || [];
  const feature = gecodeData[0];
  if (feature) {
    const [lon, lat] = feature.geometry.coordinates;
    return {
      title: feature.properties.title,
      address: feature.properties.title,
      latitude: lat,
      longitude: lon,
    };
  }
  return null;
}
