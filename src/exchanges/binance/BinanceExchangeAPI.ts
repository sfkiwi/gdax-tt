/* tslint:disable */
import { PublicExchangeAPI, Product, CandleRequestOptions, Candle, Ticker } from '../PublicExchangeAPI';
import { AuthenticatedExchangeAPI, Balances, AvailableBalance } from '../AuthenticatedExchangeAPI';
import { ExchangeTransferAPI, CryptoAddress, TransferResult, WithdrawalRequest, TransferRequest } from '../ExchangeTransferAPI';
import { PlaceOrderMessage } from '../../core';
import { LiveOrder, BookBuilder } from '../../lib';
import { BigJS, Big } from '../../lib/types';
import { BinanceConfig, createBinanceInstance, placeOrder } from './BinanceAuth';
import { ExchangeAuthConfig } from '../AuthConfig';
import { GTTError } from '../../lib/errors';
import { PRODUCT_MAP, convertBinanceOrderBookToGdaxBook, toBinanceSymbol, convertBinanceOrderToGdaxOrder, convertBinanceProductToGdaxProduct } from './BinanceCommon';
import { Logger } from '../../utils';
import { BinanceOrderBook, Binance24Ticker, BinanceBalances, BinanceOpenOrderResponse, BinanceOrderRequestFunction, BinanceAllOrders, BinanceExchangeInformation } from './BinanceMessages';

export class BinanceExchangeAPI implements PublicExchangeAPI, AuthenticatedExchangeAPI, ExchangeTransferAPI {

    owner: string = 'Binance';
    private readonly auth: ExchangeAuthConfig;
    private readonly logger: Logger;
    private binanceInstance: any;

    get api() {
        return this.binanceInstance;
    }

    constructor(config: BinanceConfig) {
        this.auth = config.auth && config.auth.key && config.auth.secret ? config.auth : undefined;
        this.binanceInstance = createBinanceInstance(this.auth, config.options);
        this.logger = config.logger || undefined;
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
        const promise: Promise<LiveOrder> = this.checkAuth().then(() => {
            return placeOrder(order, this.binanceInstance);
        });
        return promise;
    }

    cancelOrder(id: string): Promise<string> {
        // const binanceSymbol = toBinanceSymbol(id);
        throw new Error('Method not implemented.')
    }

    cancelAllOrders(gdaxProduct?: string): Promise<string[]> {
        return this.checkAuth().then(() => {
            let promise = new Promise<string[]>((resolve, reject) => {
                const binanceSymbol = toBinanceSymbol(gdaxProduct);
                this.binanceInstance.cancelOrders(binanceSymbol,(error: any, response: any) => {
                    if (this.checkResponseError('cancel order', error, reject)) {
                        return;
                    }
                    console.log(response);
                    resolve();
                });
            });
            return promise;
        });
    }

    loadOrder(id: string | number, gdaxProduct?: string): Promise<LiveOrder> {
        return this.checkAuth().then(() => {
            let promise = new Promise<LiveOrder>((resolve, reject) => {
                if (typeof id === 'number') {
                    id = id.toString(10);
                }
                const binanceSymbol = toBinanceSymbol(gdaxProduct);
                this.binanceInstance.orderStatus(binanceSymbol, id, (error: any, response: BinanceOpenOrderResponse) => {
                    if (this.checkResponseError('loading order status', error, reject)) {
                        return;
                    }
                    resolve(convertBinanceOrderToGdaxOrder(response));
                });
            });
            return promise;
        });
    }

    loadAllOrders(gdaxProduct?: string): Promise<LiveOrder[]> {
        return this.checkAuth().then(() => {

            let binanceSymbol: string | boolean;
            let binanceFunction: BinanceOrderRequestFunction;
            if (gdaxProduct === undefined || gdaxProduct === null) {
                binanceSymbol = false;
                binanceFunction = this.binanceInstance.openOrders;
            } else {
                binanceSymbol = toBinanceSymbol(gdaxProduct);
                binanceFunction = this.binanceInstance.allOrders;
            }

            let promise = new Promise<LiveOrder[]>((resolve, reject) => {
                binanceFunction(binanceSymbol, (error: any, allOrders: BinanceAllOrders) => {
                    if (this.checkResponseError('loading all orders', error, reject)) {
                        return;
                    }
                    let liveOrders: LiveOrder[] = [];

                    for (let i = 0; i < allOrders.length; i++) {
                        liveOrders.push(convertBinanceOrderToGdaxOrder(allOrders[i]));
                    }
                    resolve(liveOrders);
                });
            });
            return promise;
        });
    }

    loadBalances(): Promise<Balances> {
        return this.checkAuth().then(() => {
            let promise = new Promise<Balances>((resolve, reject) => {
                this.binanceInstance.balance((error: any, response: BinanceBalances) => {
                    if (this.checkResponseError('loading balances', error, reject)) {
                        return;
                    }
                    if (response !== undefined) {
                        let balances: Balances = {};
                        const currentUser = 'USER';
                        balances[currentUser] = {}

                        for (let property in response) {
                            const available: AvailableBalance = {
                                available: Big(response[property].available),
                                balance: Big(response[property].onOrder)
                            }
                            balances[currentUser][property] = available;
                        }
                        resolve(balances);
                    } else {
                        reject(new Error('There is no available Balance for the current account.'));
                    }
                });
            });

            return promise;
        }
        )
    }

    loadProducts(): Promise<Product[]> {
        const promise: Promise<Product[]> = new Promise<Product[]>((resolve, reject) => {
            this.binanceInstance.exchangeInfo((error: any, response: BinanceExchangeInformation) => {
                if (this.checkResponseError('loading products', error, reject)) {
                    return;
                }
                let products: Product[] = [];
                for (let i = 0; i < response.symbols.length; i++) {
                    const product = convertBinanceProductToGdaxProduct(response.symbols[i])
                    products.push(product);
                }
                resolve(products);
            });

        });
        return promise;
    }

    loadMidMarketPrice(gdaxProduct: string): Promise<BigJS> {
        throw new Error('Method not implemented. ');
    }

    loadOrderbook(gdaxProduct: string): Promise<BookBuilder> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        const promise: Promise<BookBuilder> = new Promise<BookBuilder>((resolve, reject) => {
            this.binanceInstance.depth(binanceSymbol, (error: any, data: BinanceOrderBook, symbol: string) => {
                if (this.checkResponseError('loading order book', error, reject)) {
                    return;
                }
                const book = convertBinanceOrderBookToGdaxBook(data, this.logger);
                resolve(book);
            })
        }).then((book: BookBuilder) => {
            return Promise.resolve(book);
        }).catch((err: Error) => {
            return Promise.reject(new GTTError('Error loading ' + binanceSymbol + ' order book from Binance', err));
        })
        return promise;
    }

    loadTicker(gdaxProduct: string): Promise<Ticker> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        const promise: Promise<Ticker> = new Promise<Ticker>((resolve, reject) => {
            this.binanceInstance.prevDay(binanceSymbol, (error: any, response: Binance24Ticker) => {
                if (this.checkResponseError('loading ticker', error, reject)) {
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
        }).then((ticker: Ticker) => {
            return Promise.resolve(ticker);
        }).catch((err: Error) => {
            return Promise.reject(new GTTError('Error loading ' + binanceSymbol + ' ticker from Binance', err));
        });

        return promise;
    }

    loadCandles(options: CandleRequestOptions): Promise<Candle[]> {

        const binanceSymbol = BinanceExchangeAPI.product(options.gdaxProduct);
        const candleSticksOptions = {
            limit: options.limit || 500,
            endTime: options.from || undefined,
        }
        const promise: Promise<Candle[]> = new Promise<Candle[]>((resolve, reject) => {
            this.binanceInstance.candlesticks(binanceSymbol, options.interval, (error: any, ticks: any) => {
                if (this.checkResponseError('loading candles', error, reject)) {
                    return;
                }
                let candleList: Candle[] = [];
                for (let i = 0; i < ticks.length; i++) {
                    const [time, open, high, low, close, volume] = ticks[i];
                    let candle: Candle = {
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

    checkAuth(): Promise<ExchangeAuthConfig> {
        return new Promise<ExchangeAuthConfig>((resolve, reject) => {
            const apiKey = this.binanceInstance.getOption('APIKEY');
            const apiSecret = this.binanceInstance.getOption('APISECRET');
            if ((apiSecret && apiKey) || this.auth) {
                resolve(this.auth);
                return;
            }
            reject(new Error('You cannot make authenticated requests if a ExchangeAuthConfig object was not provided to the BinanceExchangeAPI constructor'));
        });
    }

    /* BINANCE SPECIFIC FUNCTIONS */

    /**
     * Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
     * return the given product
     * @param gdaxProduct
     * @returns {string} Binance product code
     */
    static product(gdaxProduct: string) {
        return PRODUCT_MAP[gdaxProduct] || gdaxProduct;
    }

    /**
     * Function to check generic errors response from Binance API.
     * @param messagePart Error message part (example: 'loading balances')
     * @param error The error object
     * @param reject The Promise reject function
     */
    private checkResponseError(messagePart: string, error: any, reject: (reason: any) => void) {
        if (error === undefined || error === null)
            return false;

        if (error.statusCode && error.statusCode !== 200) {
            if (error.body) {
                const errorBody = JSON.parse(error.body);
                reject(new Error('Error ' + messagePart + ' from Binance.\nCode: ' + errorBody.code + '\nMessage: ' + errorBody.msg))
                return true;
            }
        }
        reject(new Error('An error occurred during the ' + messagePart + ' from Binance: \n' + error));
        return true;
    }
}
