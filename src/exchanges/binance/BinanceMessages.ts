
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
export type OrderSide = 'BUY' | 'SELL';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export type BinanceResponseFunction = (error: any, response: any) => void;
export type BinanceOrderRequestFunction = (symbol: string | boolean | any[], callback: BinanceResponseFunction) => void;

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

/**
 * Binance base order response
 */
export interface BinanceOrderResponseBase {
    symbol: string;
    orderId: number;
    clientOrderId: string;
    price: string;
    origQty: string;
    executedQty: string;
    status: OrderStatus;
    timeInForce: TimeInForce;
    type: OrderType;
    side: OrderSide;
}

/**
 * placeOrder response.
 */
export interface BinanceOrderResponse extends BinanceOrderResponseBase {
    transactTime: number;
}

/**
 * loadOrder response.
 */
export interface BinanceOpenOrderResponse extends BinanceOrderResponseBase {
    cummulativeQuoteQty: string;
    stopPrice: string;
    icebergQty: string;
    time: number;
    updateTime: number;
    isWorking: boolean;
}

/**
 * loadAllOrders response.
 */
export interface BinanceAllOrders {
    [indexer: number]: BinanceOpenOrderResponse;
}

/**
 * loadBalance response.
 */
export interface BinanceAvailableBalances {
    available: string;
    onOrder: string;
}

export interface BinanceBalances {
    [currency: string]: BinanceAvailableBalances;
}
