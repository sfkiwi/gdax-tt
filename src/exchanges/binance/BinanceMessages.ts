
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

export interface BinanceOrderResponse {
    symbol: string;
    orderId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    status: string;
    timeInForce: string;
    type: string;
    side: string;
}

export interface BinanceAvailableBalances {
    available: string;
    onOrder: string;
}

export interface BinanceBalances {
    [currency: string]: BinanceAvailableBalances;
}

export interface BinanceOpenOrder {
    symbol: string;
    orderId: number;
    clientOrderId: string;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: string;
    timeInForce: string;
    type: string;
    side: string;
    stopPrice: string;
    icebergQty: string;
    time: number;
    updateTime: number;
    isWorking: boolean;
}
