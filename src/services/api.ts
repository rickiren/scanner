import axios from 'axios';
import { CryptoData } from '../types/crypto';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const fetchCryptoData = async (): Promise<CryptoData[]> => {
  const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250,
      sparkline: false,
      price_change_percentage: '1h,24h'
    }
  });
  return response.data;
};