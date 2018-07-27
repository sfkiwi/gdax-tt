
/**
 * Binance raw tick information
 */
export interface BinanceRawTick {
    /** Timestamp */
    t: number;
    T: number;
    /** Symbol */
    s: string;
    /** Interval */
    i: string;
    f: number;
    L: number;
    /** Open */
    o: string;
    /** Close */
    c: string;
    /** High */
    h: string;
    /** Low */
    l: string;
    /** Volume */
    v: string;
    /** Number of trades */
    n: number;
    /** Is Final */
    x: boolean;
    q: string;
    /** Buy voulme */
    V: string;
    /** Quote Buy Volume */
    Q: string;
    B: string;
}

/**
 * Binance raw candlesticks.
 * Answer from binanceAPI.websockets.candlesticks.
 */
export interface BinanceRawCandlesticks {
    /** Event type */
    e: string;
    /** Event time */
    E: number;
    /** Binance symbol */
    s: string;
    /** Ticks */
    k: BinanceRawTick;
}

/**
 * Binance candlesticks
 */
export interface BinanceCandlesticks {
    symbol: string;
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    trades: number;
    interval: string;
    isFinal: boolean;
    quoteVolume: string;
    buyVolume: string;
    quoteBuyVolume: string;
}

/**
 * Represents market depth for a symbol
 */
export interface BinanceMarketDepth {
    /** Event Type */
    e: string;
    /** Event Time */
    E: number;
    /** Symbol */
    s: string;
    /** Update ID */
    U: number;
    u: number;
    /** Bid Depth */
    b: any;
    /** Ask Depth */
    a: any;
}
