import { BinanceConfig, createBinanceInstance } from './BinanceAuth';
import { Observable } from 'rxjs';
import { Ticker } from '../PublicExchangeAPI';
import { Big } from '../../lib/types';
import { Binance24Ticker, toBinanceSymbol } from './BinanceCommon';

interface ObservablePair {
    observable: Observable<any>;
    endpoint: string;
}

export class BinanceWebsocketAPI {

    private binanceInstance: any;
    private observables: Map<string,ObservablePair>;

    constructor(config: BinanceConfig) {
        this.binanceInstance = createBinanceInstance(config.auth, config.options);
        this.observables = new Map<string,ObservablePair>();
    }

    streamTicker(symbol: string): Observable<Ticker> {

        const binanceSymbol = toBinanceSymbol(symbol);
        const mapKey = 'ticker-'.concat(binanceSymbol);
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

    stopAllStreams(): void {

        const binanceWsAPI = this.binanceInstance.websockets;

        this.observables.forEach((value) => {
            binanceWsAPI.terminate(value.endpoint);
        });

        this.observables.clear();
    }
}
