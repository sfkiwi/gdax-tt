import { BookBuilder, AggregatedLevelWithOrders, LiveOrder } from '../../lib';
import { Logger } from '../../utils';
import { Side } from '../../lib/sides';
import { BigJS, Big } from '../../lib/types';
import { BinanceOrderBook, BinanceOpenOrderResponse, BinanceOrderResponse, BinanceProduct, FilterType, BinanceFilter } from './BinanceMessages';
import { Product } from '../PublicExchangeAPI';

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

// -------------------------- Helper methods -------------------------------------------------

/**
 * Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
 * return the given product
 * @param gdaxProduct
 * @returns {string} Binance product code
 */
export function toBinanceSymbol(gdaxProduct: string): string {
  return PRODUCT_MAP[gdaxProduct] || gdaxProduct;
}

/**
 * Convert Binance books to the equivalent GDAX book
 * 
 * @param binanceProduct
 * @returns {string} GDAX product code
 */
export function fromBinanceSymbol(binanceProduct: string): string {
  const base = binanceProduct.slice(0, 3);
  const quote = binanceProduct.slice(3, 6);
  return base + '-' + quote;
}

/**
 * Function to check generic errors response from Binance API.
 * 
 * @param messagePart Error message part (example: 'loading balances')
 * @param error The error object
 * @param reject The Promise reject function
 */
export function checkResponseError(messagePart: string, error: any, reject: (reason: any) => void) {
  if (error === undefined || error === null) {
    return false;
  }

  if (error.statusCode && error.statusCode !== 200) {
    if (error.body) {
      const errorBody = JSON.parse(error.body);
      reject(new Error('Error ' + messagePart + ' from Binance.\nCode: ' + errorBody.code + '\nMessage: ' + errorBody.msg));
      return true;
    }
  }
  reject(new Error('An error occurred during the ' + messagePart + ' from Binance: \n' + error));
  return true;
}

/**
 * Convert Binance order book to GDAX Order book format.
 * 
 * @param book The Binance order book received from request
 * @param logger The logger class
 */
export function convertBinanceOrderBookToGdaxBook(book: BinanceOrderBook, logger?: Logger): BookBuilder {
  const bookBuilder = new BookBuilder(logger);

  for (const price in book.asks) {
    const quantity = book.asks[price];
    addToLevel('sell', price, quantity, book.asks);
  }

  for (const price in book.bids) {
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
      bookBuilder.addLevel(side, convertOrder(side, orderPrice, orderQuantity));
    } catch (err) {
      const newSize = Big(orderQuantity).abs().plus(bookBuilder.getOrder(orderPrice).size);
      orders[orderPrice] = newSize.toString();
      bookBuilder.modify(orderPrice, newSize, side);
    }
  }

  /**
   * Convert order to proper format
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
}

/**
 * Type guard function to check the BinanceOrder is OpenOrder or just ResponseOrder
 * 
 * @param binanceOrder 
 */
function isOpenOrder(binanceOrder: BinanceOpenOrderResponse | BinanceOrderResponse): binanceOrder is BinanceOpenOrderResponse {
  return (binanceOrder as BinanceOpenOrderResponse).cummulativeQuoteQty !== undefined ||
    (binanceOrder as BinanceOpenOrderResponse).stopPrice !== undefined ||
    (binanceOrder as BinanceOpenOrderResponse).icebergQty !== undefined ||
    (binanceOrder as BinanceOpenOrderResponse).updateTime !== undefined ||
    (binanceOrder as BinanceOpenOrderResponse).isWorking !== undefined;
}

/**
 * Convert Binance Open or Response order to GDAX Liver Order
 * 
 * @param binanceOrder Binance order
 */
export function convertBinanceOrderToGdaxOrder(binanceOrder: BinanceOpenOrderResponse | BinanceOrderResponse): LiveOrder {

  const extra: any = {
    clientOrderId: binanceOrder.clientOrderId,
    timeInForce: binanceOrder.timeInForce,
    type: binanceOrder.type,
  };

  let time: Date;

  if (isOpenOrder(binanceOrder)) {
    extra.cummulativeQuoteQty = binanceOrder.cummulativeQuoteQty;
    extra.stopPrice = binanceOrder.stopPrice;
    extra.icebergQty = binanceOrder.icebergQty;
    extra.updateTime = binanceOrder.updateTime;
    extra.isWorking = binanceOrder.isWorking;
    time = new Date(binanceOrder.time);
  } else {
    time = new Date(binanceOrder.transactTime);
  }

  const liveOrder: LiveOrder = {
    productId: binanceOrder.symbol,
    id: (binanceOrder.orderId) ? binanceOrder.orderId.toString() : undefined,
    price: Big(binanceOrder.price),
    side: (binanceOrder.side === 'BUY') ? 'buy' : 'sell',
    size: Big(binanceOrder.executedQty),
    status: binanceOrder.status,
    time: time,
    extra: extra,
  };
  return liveOrder;
}

/**
 * Convert Binance product to GDAX product
 * 
 * @param binanceProduct Binance product
 */
export function convertBinanceProductToGdaxProduct(binanceProduct: BinanceProduct): Product {

  function findFilter(filterType: FilterType, binanceFilters: BinanceFilter[]) {
    if (binanceFilters !== undefined || binanceFilters !== null) {
      return null;
    }
    for (const iterator of binanceFilters) {
      if (iterator.filterType === filterType) {
        return iterator;
      }
    }
    return null;
  }

  const priceFilter = findFilter('PRICE_FILTER', binanceProduct.filters);
  let minPrice;
  let maxPrice;
  let tickSize;

  if (priceFilter !== null) {
    minPrice = priceFilter.minPrice;
    maxPrice = priceFilter.maxPrice;
    tickSize = priceFilter.tickSize;
  }

  const product: Product = {
    id: fromBinanceSymbol(binanceProduct.symbol),
    sourceId: binanceProduct.symbol,
    baseCurrency: binanceProduct.baseAsset,
    quoteCurrency: binanceProduct.quoteAsset,
    baseMaxSize: Big(maxPrice),
    baseMinSize: Big(minPrice),
    quoteIncrement: Big(tickSize),
    sourceData: binanceProduct,
  };
  return product;
}
