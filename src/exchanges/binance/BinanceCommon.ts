/* tslint:disable */
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
 * A map of supported Binance books to the equivalent GDAX book
 */
export function fromBinanceSymbol(binanceProduct: string): string {
  const base = binanceProduct.slice(0, 3);
  const quote = binanceProduct.slice(3, 6);
  return base + '-' + quote;
}


/**
 * Convert Binance order book to GDAX Order book format.
 * 
 * @param book The Binance order book received from request
 * @param logger The logger class
 */
export function convertBinanceOrderBookToGdaxBook(book: BinanceOrderBook, logger?: Logger): BookBuilder {
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


function isOpenOrder(binanceOrder: BinanceOpenOrderResponse | BinanceOrderResponse): binanceOrder is BinanceOpenOrderResponse {
  return (<BinanceOpenOrderResponse>binanceOrder).cummulativeQuoteQty !== undefined ||
    (<BinanceOpenOrderResponse>binanceOrder).stopPrice !== undefined ||
    (<BinanceOpenOrderResponse>binanceOrder).icebergQty !== undefined ||
    (<BinanceOpenOrderResponse>binanceOrder).updateTime !== undefined ||
    (<BinanceOpenOrderResponse>binanceOrder).isWorking !== undefined;
}

export function convertBinanceOrderToGdaxOrder(binanceOrder: BinanceOpenOrderResponse | BinanceOrderResponse): LiveOrder {

  let extra: any = {
    clientOrderId: binanceOrder.clientOrderId,
    timeInForce: binanceOrder.timeInForce,
    type: binanceOrder.type,
  }

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
    extra: extra
  }
  return liveOrder;
}

export function convertBinanceProductToGdaxProduct(binanceProduct: BinanceProduct): Product {

  function findFilter(filterType: FilterType, binanceFilters: BinanceFilter[]) {

    if (binanceFilters !== undefined || binanceFilters !== null)
      return null;

    for (let i = 0; i < binanceFilters.length; i++) {
      if (binanceFilters[i].filterType === filterType) {
        return binanceFilters[i];
      }
    }
    return null;
  }

  const priceFilter = findFilter('PRICE_FILTER', binanceProduct.filters);
  let minPrice, maxPrice, tickSize;

  if (priceFilter !== null) {
    minPrice = priceFilter.minPrice
    maxPrice = priceFilter.maxPrice;
    tickSize = priceFilter.tickSize;
  }

  let product: Product = {
    id: fromBinanceSymbol(binanceProduct.symbol),
    sourceId: binanceProduct.symbol,
    baseCurrency: binanceProduct.baseAsset,
    quoteCurrency: binanceProduct.quoteAsset,
    baseMaxSize: Big(maxPrice),
    baseMinSize: Big(minPrice),
    quoteIncrement: Big(tickSize),
    sourceData: binanceProduct
  }

  return product;

}