/* tslint:disable */
/**
 * A map of supported GDAX books to the equivalent Binance book
 */
export const PRODUCT_MAP: { [index: string]: string } = {
    'BNB-BTC': 'BNBBTC',
    'BNB-ETH': 'BNBETH',
    'LTC-USD': 'LTCUSD',
    'LTC-BTC': 'LTCBTC',
    'ETH-USD': 'ETHUSD',
    'ETH-BTC': 'ETHBTC'
};

export interface BinanceBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

/**
 * 24hr Ticker statistics for a single symbol pushed every second
 */
export interface Binance24Ticker {
  eventType: string;
  eventTime: number;
  symbol: string;
  priceChange: string;
  percentChange: string;
  averagePrice: string;
  prevClose: string;
  close: string;
  closeQty: string;
  bestBid: string;
  bestBidQty: string;
  bestAsk: string;
  bestAskQty: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
  openTime: string;
  closeTime: string;
  firstTradeId: string;
  lastTradeId: string;
  numTrades: string;
}

export interface BinanceTick {
  [indexer:number]: {
  time: number; // OpenTime
  open: string; // Open
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  assetVolume: string;
  trades: number;
  buyBaseVolume: string;
  buyAssetVolume: string;
  ignored: string;
  }
}

export interface BinanceCandlesticks {
    eventType: string;
    eventTime: number;
    symbol: string;
    ticks: BinanceTick;
}
