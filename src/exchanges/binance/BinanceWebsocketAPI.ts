import { BinanceConfig, createBinanceInstance } from './BinanceAuth';
import { Observable } from 'rxjs';
import { Ticker, CandleInterval } from '../PublicExchangeAPI';
import { Big } from '../../lib/types';
import { toBinanceSymbol, convertBinanceOrderBookToGdaxBook } from './BinanceCommon';
import { BookBuilder } from '../../lib';
import { Logger } from '../../utils';
import { BinanceCandlesticks, BinanceRawCandlesticks } from './BinanceWebsocketInterfaces';
import { Binance24Ticker } from './BinanceMessages';

export type BinanceWebsocketName = 'ticker' | 'orderbook' | 'candlestick';

interface ObservablePair {
    observable: Observable<any>;
    endpoint: string;
}

export class BinanceWebsocketAPI {

    private binanceInstance: any;
    private observables: Map<string, ObservablePair>;
    private readonly logger: Logger;

    constructor(config: BinanceConfig) {
        this.binanceInstance = createBinanceInstance(config.auth, config.options);
        this.observables = new Map<string, ObservablePair>();
        this.logger = config.logger;
    }

    streamTicker(symbol: string): Observable<Ticker> {

        const binanceSymbol = toBinanceSymbol(symbol);
        const mapKey = this.getObservableKey('ticker', binanceSymbol);
        let pair: ObservablePair = this.observables.get(mapKey);

        if (pair) {
            return pair.observable;
        }

        let endpoint;
        const obs = new Observable<Ticker>((sub) => {
            endpoint = this.binanceInstance.websockets.prevDay(binanceSymbol, (error: any, response: Binance24Ticker) => {
                if (error) {
                    if (error.statusCode && error.statusCode !== 200) {
                        if (error.body) {
                            sub.error(new Error('Error loading ticker from Binance.\nCode:' + error.body.code + '\nMessage:' + error.body.msg));
                        }
                    }
                    sub.error(new Error('An error occurred during the loading ticker from Binance: ' + error));
                }
                const ticker: Ticker = {
                    productId: response.symbol,
                    trade_id: response.lastTradeId,
                    volume: Big(response.volume),
                    ask: Big(response.bestAsk),
                    price: Big(response.priceChange),
                    bid: Big(response.bestBid),
                    time: new Date(response.eventTime),
                };
                sub.next(ticker);
            });
        });

        pair = {
            endpoint: endpoint,
            observable: obs
        };

        this.observables.set(mapKey, pair);
        return obs;
    }

    streamCandlesticks(symbol: string, interval: CandleInterval = '5m'): Observable<BinanceCandlesticks> {

        const binanceSymbol = toBinanceSymbol(symbol);
        const mapKey = this.getObservableKey('candlestick', binanceSymbol);
        let pair: ObservablePair = this.observables.get(mapKey);

        if (pair) {
            return pair.observable;
        }

        let endpoint;
        const obs = new Observable<BinanceCandlesticks>((sub) => {
            endpoint = this.binanceInstance.websockets.candlesticks(binanceSymbol, interval, (candlestick: BinanceRawCandlesticks) => {
                const tick = candlestick.k;
                const candle: BinanceCandlesticks = {
                    time: candlestick.E,
                    symbol: candlestick.s,
                    open: tick.o,
                    close: tick.c,
                    high: tick.h,
                    low: tick.l,
                    volume: tick.v,
                    trades: tick.n,
                    interval: tick.i,
                    isFinal: tick.x,
                    quoteVolume: tick.q,
                    buyVolume: tick.V,
                    quoteBuyVolume: tick.Q,
                };
                sub.next(candle);
            });
        });

        pair = {
            endpoint: endpoint,
            observable: obs,
        };

        this.observables.set(mapKey, pair);
        return obs;
    }

    streamOrderbook(symbol: string, limit: number = 500): Observable<BookBuilder> {

        const binanceSymbol = toBinanceSymbol(symbol);
        const mapKey = this.getObservableKey('orderbook', binanceSymbol);
        let pair: ObservablePair = this.observables.get(mapKey);

        if (pair) {
            return pair.observable;
        }

        let endpoint;
        const obs = new Observable<BookBuilder>((sub) => {
            // tslint:disable-next-line
            endpoint = this.binanceInstance.websockets.depthCache(binanceSymbol, (symbol: string = undefined, depth: any) => {
                const bookBuilder = convertBinanceOrderBookToGdaxBook(depth, this.logger);
                sub.next(bookBuilder);
            }, limit);
        });

        pair = {
            endpoint: endpoint,
            observable: obs,
        };

        this.observables.set(mapKey, pair);
        return obs;
    }

    stopAllStreams(): void {
        const binanceWsAPI = this.binanceInstance.websockets;
        this.observables.forEach((value) => {
            binanceWsAPI.terminate(value.endpoint);
        });

        this.observables.clear();
    }

    stopStream(streamName: BinanceWebsocketName, symbol?: string): boolean {
        const mapKey = this.getObservableKey(streamName, toBinanceSymbol(symbol));
        const pair: ObservablePair = this.observables.get(mapKey);
        if (pair) {
            const binanceWsAPI = this.binanceInstance.websockets;
            binanceWsAPI.terminate(pair.endpoint);
            this.observables.delete('mapKey');
            return true;
        } else {
            return false;
        }
    }

    getObservableStream(streamName: BinanceWebsocketName, symbol?: string): Observable<any> {
        const mapKey = this.getObservableKey(streamName, toBinanceSymbol(symbol));
        const pair: ObservablePair = this.observables.get(mapKey);
        if (pair) {
            return pair.observable;
        } else {
            return null;
        }
    }

    hasStream(streamName: BinanceWebsocketName, symbol?: string): boolean {
        const mapKey = this.getObservableKey(streamName, toBinanceSymbol(symbol));
        return this.observables.has(mapKey);
    }

    private getObservableKey(streamName: BinanceWebsocketName, binanceSymbol?: string): string {
        let mapKey: string = streamName;
        if (binanceSymbol) {
            mapKey = mapKey.concat('&').concat(binanceSymbol);
        }
        return mapKey;
    }
}
