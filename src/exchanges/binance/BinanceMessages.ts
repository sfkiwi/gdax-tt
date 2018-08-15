
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';

export type OrderSide = 'BUY' | 'SELL';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export type RateLimitType = 'REQUESTS_WEIGHT' | 'ORDERS';
export type RateLimitInterval = 'SECOND' | 'MINUTE' | 'DAY';

export type BinanceResponseFunction = (error: any, response: any) => void;
export type BinanceOrderRequestFunction = (symbol: string | boolean | any[], callback: BinanceResponseFunction) => void;
/**
 * Define order type information.
 *      - 'LIMIT_MAKER' and 'LIMIT': orders that will be rejected if they would immediately match and trade as a taker.
 *      - 'STOP_LOSS' and 'TAKE_PROFIT': executes a 'MARKET' order when the stopPrice is reached.
 *      - Any 'LIMIT' or 'LIMIT_MAKER': type order can be made an iceberg order by sending an icebergQty.
 *      - Any order with an 'icebergQty' MUST have timeInForce set to GTC.
 * @type {OrderType}
 */
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';

/**
 * Define trading rules on a symbol or an exchange.
 *      - 'PRICE_FILTER': defines the price rules for a symbol.
 *      - 'LOT_SIZE': defines the quantity (aka "lots" in auction terms) rules for a symbol.
 *      - 'MIN_NOTIONAL': defines the minimum notional value allowed for an order on a symbol.
 *      - 'MAX_NUM_ORDERS': defines the maximum number of orders an account is allowed to have open on a symbol.
 *      - 'MAX_NUM_ALGO_ORDERS' defines the maximum number of "algo" orders an account is allowed to have open on a symbol.
 *      - 'ICEBERG_PARTS': defines the maximum parts an iceberg order can have.
 *      - 'EXCHANGE_MAX_NUM_ORDERS': defines the maximum number of orders an account is allowed to have open on the exchange.
 *      - 'EXCHANGE_MAX_NUM_ALGO_ORDERS': defines the maximum number of "algo" orders an account is allowed to have open on the exchange
 * @type {FilterType} 
 */
export type FilterType = 'PRICE_FILTER' | 'LOT_SIZE' | 'MIN_NOTIONAL' | 'ICEBERG_PARTS' | 'MAX_NUM_ALGO_ORDERS' | 'EXCHANGE_MAX_NUM_ORDERS' | 'EXCHANGE_MAX_NUM_ALGO_ORDERS';

/**
 * Best price/qty on the order book for a symbol.
 */
export interface BinanceBookTicker {
    symbol: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
}

/**
 * Represents the latest price of a Binance symbol
 */
export interface BinanceSymbolPrice {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    prevClosePrice: string;
    lastPrice: string;
    lastQty: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
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
 * Binance order book
 */
export interface BinanceOrderBook {
    bids: any;
    asks: any;
}

/**********************************************
 * Binance base order response
 *********************************************/
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
 * Binance place order response.
 * Answer from placeOrder.
 */
export interface BinanceOrderResponse extends BinanceOrderResponseBase {
    transactTime: number;
}

/**
 * Binance order status response.
 * Answer from loadOrder and part of loadAllOrders
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
 * List of all open orders.
 * All account orders; active, canceled, or filled.
 * Answer from loadAllOrders.
 */
export interface BinanceAllOrders extends Array<BinanceOpenOrderResponse> { }

/*
 * Cancel a active order response.
 */
export interface BinanceCancelOrder {
    symbol: string;
    origClientOrderId: string;
    orderId: number;
    clientOrderId: string;
}

/**
 * Binance symbol available balances
 */
export interface BinanceAvailableBalances {
    available: string;
    onOrder: string;
}

/**
 * List of current balances
 */
export interface BinanceBalances {
    [currency: string]: BinanceAvailableBalances;
}

/**
 * Binance product filter
 */
export interface BinanceFilter {
    filterType: FilterType;
    /**
     * Defines the minimum price/stopPrice allowed for 'PRICE_FILTER'.
     */
    minPrice?: string;
    /**
     * Defines the maximum price/stopPrice allowed for 'PRICE_FILTER'.
     */
    maxPrice?: string;
    /**
     * Defines the intervals that a price/stopPrice can be increased/decreased by for 'PRICE_FILTER'.
     */
    tickSize?: string;
    /**
     * Defines the minimum quantity/icebergQty allowed for 'LOT_SIZE'.
     */
    minQty?: string;
    /**
     * Defines the maximum quantity/icebergQty allowed for 'LOT_SIZE'.
     */
    maxQty?: string;
    /**
     * Defines the intervals that a quantity/icebergQty can be increased/decreased by for 'LOT_SIZE'.
     */
    stepSize?: string;
    /**
     * An order's notional value is the price * quantity for 'MIN_NOTIONAL'.
     */
    minNotional?: string;
    /**
     * This property is used by the following filters 'MAX_NUM_ORDERS', 'ICEBERG_PARTS', 'EXCHANGE_MAX_NUM_ORDERS' and 'EXCHANGE_MAX_NUM_ALGO_ORDERS'
     *      
     *      - 'MAX_NUM_ORDERS':  Maximum number of orders an account is allowed. Note that both "algo" orders and normal orders are counted for this filter.
     *      - 'ICEBERG_PARTS': Maximum parts an iceberg order can have. The number is defined as CEIL(qty / icebergQty).
     *      - 'EXCHANGE_MAX_NUM_ORDERS': Maximum number of orders an account is allowed to have open on the exchange.
     *      - 'EXCHANGE_MAX_NUM_ALGO_ORDERS': Maximum number of "algo" orders an account is allowed to have open on the exchange
     */
    limit?: number;
    /**
     * Maximum number of "algo" orders an account is allowed for 'MAX_NUM_ALGO_ORDERS'.
     * "Algo" orders are:
     *      - STOP_LOSS;
     *      - STOP_LOSS_LIMIT;
     *      - TAKE_PROFIT;
     *      - TAKE_PROFIT_LIMIT;
     */
    maxNumAlgoOrders?: number;
}

/**
 * Binance product
 */
export interface BinanceProduct {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    orderTypes: OrderType[];
    icebergAllowed: boolean;
    filters: BinanceFilter[];
}

/**
 * Binance product rate limit
 */
export interface BinanceRateLimit {
    rateLimitType: RateLimitType;
    interval: RateLimitInterval;
    limit: number;
}

/**
 * Binance exchange information
 * Response from loadProducts
 */
export interface BinanceExchangeInformation {
    timezone: string;
    serverTime: number;
    rateLimits: BinanceRateLimit[];
    exchangeFilters: any[];
    symbols: BinanceProduct[];
}

/**
 * Binance fetched deposit address response.
 */
export interface BinanceCryptoAddress {
    address: string;
    success: boolean;
    addressTag?: string;
    url: string;
}

/**
 * Binance submitted withdraw response.
 */
export interface BinanceWithdrawResponse {
    msg: string;
    success: boolean;
    id: string;
}
