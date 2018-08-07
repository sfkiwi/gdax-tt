/* tslint:disable */
import { ExchangeFeed, ExchangeFeedConfig } from "../ExchangeFeed";
import { toBinanceSymbol } from "./BinanceCommon";
import { BinanceOptions } from "./BinanceAuth";
// import { Observable } from "../../../node_modules/rxjs";

export type BinanceChannel = 'ticker' | 'bookticker' | 'candlestick' | 'miniTicker' | 'trade';


export interface BinanceExchangeFeedConfig extends ExchangeFeedConfig {
    wsUrl: 'wss://stream.binance.com:9443/ws/';
    options: BinanceOptions;
};

interface BinanceSubscription {
    //observable: Observable<any>;
    endpoint: string;
}

// interface BinanceSubscriptionMap {
//     [indexer: string]: BinanceSubscription;
// }
interface BinanceEvent {
    stream:string;
    data:any;
}


export default class BinanceFeed extends ExchangeFeed {

    //private combinedStream = 'wss://stream.binance.com:9443/stream?streams=';
    private subscriptions: Map<string, BinanceSubscription>;
    protected _owner: string;
    private pinger: NodeJS.Timer;

    get owner(): string {
        return 'Binance';
    }

    constructor(config: BinanceExchangeFeedConfig) {
        super(config);
        this.url = config.wsUrl || 'wss://stream.binance.com:9443/ws/';
        this.subscriptions = new Map<string, BinanceSubscription>();
        this.connect();

    }

    clearChannels() {
        this.subscriptions.clear();
    }

    subscribe(channel: BinanceChannel, product: string): void {
        let streamEvent: BinanceEvent;
        const binanceSymbol = toBinanceSymbol(product);
        switch (channel) {
            case 'trade': {
                streamEvent = {
                    stream: binanceSymbol.toLowerCase()+'@trade',
                    data: null
                }
            }
        }

        this.send(streamEvent, (err: Error) => {
            this.log('error', `Error subscribing to Binance channel ${channel} ${product}`, err);
        });

    }



    protected handleMessage(msg: any): void {
        console.log(msg);
        this.push(msg);
    }
    protected onOpen(): void {
        this.pinger = setInterval(() => {
            this.send({ event: 'ping' });
        }, 120000);
        //this.resubscribeAll();
    }

    protected onClose(code: number, reason: string) {
        clearInterval(this.pinger);
        super.onClose(code, reason);
    }


}
