import { BinanceConfig, createBinanceInstance } from "./BinanceAuth";

import {Observable} from 'Rxjs';
import { Ticker } from "../PublicExchangeAPI";
import { Big } from "../../lib/types";
import { Binance24Ticker, toBinanceSymbol } from "./BinanceCommon";


interface ObservablePair {
    observable:Observable<any>,
    endpoint:string
}

export class BinanceWebsocketAPI {

    private binanceInstance: any;
    private observables: Map<string,ObservablePair>;

    constructor(config : BinanceConfig) {
        //this.auth = config.auth && config.auth.key && config.auth.secret ? config.auth : undefined;
        this.binanceInstance = createBinanceInstance(config.auth, config.options);
    }

    streamTicker(symbol: string) : Observable<Ticker> {

        const binanceSymbol = toBinanceSymbol(symbol);
        const mapKey = 'ticker-'.concat(binanceSymbol);
        let pair : ObservablePair = this.observables.get(mapKey);

        if (pair)
            return pair.observable;

     
        let endpoint;
        let obs = new Observable<Ticker>(sub => {
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
                }
                sub.next(ticker);
            });
        });

        pair = {
            endpoint: endpoint,
            observable: obs
        }

        this.observables.set(mapKey, pair);

        return obs;
        // obs.subscribe(ticker => {

        // });
        //from()

    }

    stopAllStreams(): void {
        this.observables.forEach((value) => {
            this.binanceInstance.terminate(value.endpoint);
        });

        this.observables.clear();
    }

}