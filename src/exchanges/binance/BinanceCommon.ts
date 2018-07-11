
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
