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

/**
* Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
* return the given product
* @param gdaxProduct
* @returns {string} Binance product code
*/
export function toBinanceSymbol(gdaxProduct: string) {
  return PRODUCT_MAP[gdaxProduct] || gdaxProduct;
}

//export function convertBinanceBookToGdax()