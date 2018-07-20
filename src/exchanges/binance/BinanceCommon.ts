import { BookBuilder, AggregatedLevelWithOrders } from '../../lib';
import { Logger } from '../../utils';
import { Side } from '../../lib/sides';
import { BigJS, Big } from '../../lib/types';

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

export interface BinanceOrderBook {
  bids: any;
  asks: any;
}

    // -------------------------- Helper methods -------------------------------------------------


/**
* Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
* return the given product
* @param gdaxProduct
* @returns {string} Binance product code
*/
export function toBinanceSymbol(gdaxProduct: string) {
  return PRODUCT_MAP[gdaxProduct] || gdaxProduct;
}

/**
 * Convert Binancer order book to GDAX Order book format.
 * 
 * @param book The Binance order book received from request
 * @param logger The logger class
 */
export function convertBinanceOrderBookToGdaxBook(book: BinanceOrderBook, logger ?: Logger): BookBuilder {
  const bookBuilder = new BookBuilder(logger);

  for (let price in book.asks) {
    const quantity = book.asks[price];
    addToLevel('sell', price, quantity, book.asks);
  }

  for (let price in book.bids) {
    const quantity = book.bids[price];
    addToLevel('buy', price, quantity, book.bids);
  }

  bookBuilder.sequence = 0;
  return bookBuilder;

  /**
   * Add level to Book Builder
   * 
   * @param side sell or buy
   * @param orderPrice the order price
   * @param orderQuantity the order amount
   * @param orders the order object
   */
  function addToLevel(side: Side, orderPrice: string, orderQuantity: string, orders: any) {
    try {
      bookBuilder.addLevel(side, convertOrder(side, orderPrice, orderQuantity))
    } catch (err) {
      const newSize = Big(orderQuantity).abs().plus(bookBuilder.getOrder(orderPrice).size);
      orders[orderPrice] = newSize.toString();
      bookBuilder.modify(orderPrice, newSize, side);
    }
  }


  /**
   * Convert order to proper formate
   * 
   * @param side sell or buy
   * @param orderPrice the order price
   * @param orderQuantity the order amount
   */
  function convertOrder(side: Side, orderPrice: string, orderQuantity: string): AggregatedLevelWithOrders {
    const price: BigJS = Big(orderPrice);
    const size: BigJS = Big(orderQuantity).abs();
    const level = new AggregatedLevelWithOrders(price);
    level.addOrder({
      id: orderPrice,
      price: price,
      size: size,
      side: side
    });
    return level;
  }
  return bookBuilder;
}