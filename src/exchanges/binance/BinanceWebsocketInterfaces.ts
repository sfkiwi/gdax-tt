
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
