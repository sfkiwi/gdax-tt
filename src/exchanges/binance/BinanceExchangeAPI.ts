/* tslint:disable */
import { PublicExchangeAPI, Product, CandleRequestOptions, Candle, Ticker } from '../PublicExchangeAPI';
import { AuthenticatedExchangeAPI, Balances } from '../AuthenticatedExchangeAPI';
import { ExchangeTransferAPI, CryptoAddress, TransferResult, WithdrawalRequest, TransferRequest } from '../ExchangeTransferAPI';
import { PlaceOrderMessage } from '../../core';
import { LiveOrder, BookBuilder } from '../../lib';
import { BigJS, Big } from '../../lib/types';
import { BinanceConfig, createBinanceInstance } from './BinanceAuth';
import { ExchangeAuthConfig } from '../AuthConfig';
import { GTTError } from '../../lib/errors';
import { PRODUCT_MAP, Binance24Ticker } from './BinanceCommon';

export class BinanceExchangeAPI implements PublicExchangeAPI, AuthenticatedExchangeAPI, ExchangeTransferAPI {

    owner: string = 'Binance';
    private readonly auth: ExchangeAuthConfig;
    private binanceInstance: any;
    
    get api() {
        return this.binanceInstance;
    }
    // private readonly config : BinanceConfig;

    constructor(config: BinanceConfig) {
        this.auth = config.auth && config.auth.key && config.auth.secret ? config.auth : undefined;
        this.binanceInstance = createBinanceInstance(this.auth, config.options);
    }

    requestCryptoAddress(cur: string): Promise<CryptoAddress> {
        throw new Error('Method not implemented.');
    }

    requestTransfer(request: TransferRequest): Promise<TransferResult> {
        throw new Error('Method not implemented.');
    }

    requestWithdrawal(request: WithdrawalRequest): Promise<TransferResult> {
        throw new Error('Method not implemented.');
    }

    placeOrder(order: PlaceOrderMessage): Promise<LiveOrder> {
        throw new Error('Method not implemented.');
    }

    cancelOrder(id: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    cancelAllOrders(gdaxProduct?: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    loadOrder(id: string): Promise<LiveOrder> {
        throw new Error('Method not implemented.');
    }

    loadAllOrders(gdaxProduct?: string): Promise<LiveOrder[]> {
        throw new Error('Method not implemented.');
    }

    loadBalances(): Promise<Balances> {
        throw new Error('Method not implemented.');
    }

    loadProducts(): Promise<Product[]> {
        throw new Error('Method not implemented.');
    }

    loadMidMarketPrice(gdaxProduct: string): Promise<BigJS> {
        throw new Error('Method not implemented. ');
    }

    loadOrderbook(gdaxProduct: string): Promise<BookBuilder> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        const endpoint = this.binanceInstance.websockets.depthCache(binanceSymbol, (symbol: string, depth: any) => {
            //console.log(depth);
        });
        console.log(endpoint);
        const promise: Promise<BookBuilder> = new Promise<BookBuilder>((resolve, reject) => {
            
        });
        return promise;
    }

    loadTicker(gdaxProduct: string): Promise<Ticker> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        const promise: Promise<Ticker> = new Promise<Ticker>((resolve, reject) => {
            this.binanceInstance.websockets.prevDay(binanceSymbol, (error: any, response: Binance24Ticker) => {
                if (error) {
                    if (error.statusCode && error.statusCode !== 200) {
                        if (error.body) {
                            reject(new Error('Error loading ticker from Binance.\nCode:' + error.body.code + '\nMessage:' + error.body.msg))
                            return;
                        }
                    }
                    reject(new Error('An error occurred during the loading ticker from Binance: ' + error));
                    return;
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
                resolve(ticker);
            });
        })
        .then((ticker: Ticker) => {
            return Promise.resolve(ticker);
        })
        .catch((err: Error) => {
            return Promise.reject(new GTTError('Error loading ' + gdaxProduct + ' ticker from Binance', err));
        });

        return promise;
    }

    loadCandles(options: CandleRequestOptions): Promise<Candle[]> {

        const binanceSymbol = BinanceExchangeAPI.product(options.gdaxProduct);
        const candleSticksOptions = {
            limit: options.limit || 500,
            //endTime: options.from || undefined,
            //startTime
        }
        const promise: Promise<Candle[]> = new Promise<Candle[]>((resolve, reject) => {
            this.binanceInstance.candlesticks(binanceSymbol, options.interval, (error:any, ticks: any) =>{
            
                if (error) {
                    reject(error);
                    return;
                }
                let candleList: Candle[] = []; 
                for (let i = 0; i < ticks.length; i++) {
                    const [time, open, high, low, close, volume] = ticks[i];
                    let candle : Candle = {
                        timestamp: new Date(time),
                        close: Big(close),
                        high: Big(high),
                        low: Big(low),
                        open: Big(open),
                        volume: Big(volume)
                    }
                    candleList.push(candle);
                }
                //let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
                resolve(candleList);
            }, candleSticksOptions);
        });

        return promise;
    }

    /**
     * Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
     * return the given product
     * @param gdaxProduct
     * @returns {string} Binance product code
     */
    static product(gdaxProduct: string) {
        return PRODUCT_MAP[gdaxProduct] || gdaxProduct;
    }
}
