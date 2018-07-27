import { PublicExchangeAPI, Product, CandleRequestOptions, Candle, Ticker } from '../PublicExchangeAPI';
import { AuthenticatedExchangeAPI, Balances, AvailableBalance } from '../AuthenticatedExchangeAPI';
import { ExchangeTransferAPI, CryptoAddress, TransferResult, WithdrawalRequest, TransferRequest } from '../ExchangeTransferAPI';
import { PlaceOrderMessage } from '../../core';
import { LiveOrder, BookBuilder } from '../../lib';
import { BigJS, Big } from '../../lib/types';
import { BinanceConfig, createBinanceInstance } from './BinanceAuth';
import { ExchangeAuthConfig } from '../AuthConfig';
import { GTTError } from '../../lib/errors';
import { convertBinanceOrderBookToGdaxBook, toBinanceSymbol, convertBinanceOrderToGdaxOrder, convertBinanceProductToGdaxProduct, checkResponseError } from './BinanceCommon';
import { Logger } from '../../utils';
import {
    BinanceOrderBook,
    Binance24Ticker,
    BinanceBalances,
    BinanceOpenOrderResponse,
    BinanceOrderRequestFunction,
    BinanceAllOrders,
    BinanceExchangeInformation,
    BinanceCancelOrder,
    BinanceOrderResponse,
    BinanceSymbolPrice
} from './BinanceMessages';

const BINANCE_BASE_URL = 'https://api.binance.com/api/';

export class BinanceExchangeAPI implements PublicExchangeAPI, AuthenticatedExchangeAPI, ExchangeTransferAPI {

    /**
     * Returns the Binance product that's equivalent to the given GDAX product. If it doesn't exist,
     * return the given product
     * @param gdaxProduct
     * @returns {string} Binance product code
     */
    static product = toBinanceSymbol;
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
        throw new Error('Method not implemented.' + cur);
    }

    requestTransfer(request: TransferRequest): Promise<TransferResult> {
        throw new Error('Method not implemented.' + request);
    }

    requestWithdrawal(request: WithdrawalRequest): Promise<TransferResult> {
        throw new Error('Method not implemented.' + request);
    }

    placeOrder(order: PlaceOrderMessage): Promise<LiveOrder> {
        const binanceAPI = this.binanceInstance;
        const promise: Promise<LiveOrder> = this.checkAuth().then(() => {
            const binanceSymbol = toBinanceSymbol(order.productId);
            const side = order.side.toUpperCase();
            const flags = {
                type: order.orderType.toUpperCase(),
                stopPrice: order.stopPrice || undefined
            };
            const price = (order.side === 'buy' && order.orderType === 'market') ? 0 : parseFloat(order.price);
            const quantity = parseInt(order.size, 10);
            return new Promise<LiveOrder>((resolve, reject) => {
                function binancePlaceOrder() {
                    binanceAPI.order(side, binanceSymbol, quantity, price, flags, (error: any, response: BinanceOrderResponse) => {
                        if (checkResponseError('placing order', error, reject)) {
                            return;
                        }
                        const liveOrder: LiveOrder = convertBinanceOrderToGdaxOrder(response);
                        resolve(liveOrder);
                    });
                }
                const use: boolean = binanceAPI.getOption('alwaysUseServerTime');
                if (use) {
                    binanceAPI.useServerTime(() => {
                        binancePlaceOrder();
                    });
                } else {
                    binancePlaceOrder();
                }
            });
        });
        return promise;
    }

    cancelOrder(id: string, gdaxProduct?: string): Promise<string> {
        return this.checkAuth().then(() => {
            return new Promise<string>((resolve, reject) => {
                const binanceSymbol = toBinanceSymbol(gdaxProduct);
                this.binanceInstance.cancel(binanceSymbol, id, (error: any, response: BinanceCancelOrder) => {
                    if (checkResponseError('cancel order', error, reject)) {
                        return;
                    }
                    resolve(response.orderId.toString(10));
                });
            });
        });
    }

    cancelAllOrders(gdaxProduct?: string): Promise<string[]> {
        return this.checkAuth().then(() => {
            const symbol = toBinanceSymbol(gdaxProduct);
            return new Promise<BinanceAllOrders>((resolve, reject) => {
                this.binanceInstance.signedRequest(BINANCE_BASE_URL + 'v3/openOrders', { symbol: symbol }, (error: any, response: BinanceAllOrders) => {
                    if (response.length === 0) {
                        reject(new Error('There is no orders present for the symbol ' + symbol + '.'));
                        return;
                    }
                    if (checkResponseError('cancel all orders', error, reject)) {
                        return;
                    }
                    resolve(response);
                });
            }).then((allOrders: BinanceAllOrders) => {
                const promisesArray = [];
                for (const order of allOrders) {
                    const promiseChild = new Promise<string>((resolve, reject) => {
                        const parameters = {
                            symbol: symbol,
                            orderId: order.orderId,
                        };
                        this.binanceInstance.signedRequest(BINANCE_BASE_URL + 'v3/order', parameters, (error: any, cancelOrder: BinanceCancelOrder) => {
                            if (checkResponseError('cancel all orders', error, reject)) {
                                return;
                            }
                            resolve(cancelOrder.orderId.toString(10));
                        }, 'DELETE');
                    });
                    promisesArray.push(promiseChild);
                }

                return Promise.all(promisesArray).then((values: string[]) => {
                    return Promise.resolve(values);
                });
            });
        });
    }

    loadOrder(id: string | number, gdaxProduct?: string): Promise<LiveOrder> {
        return this.checkAuth().then(() => {
            return new Promise<LiveOrder>((resolve, reject) => {
                if (typeof id === 'number') {
                    id = id.toString(10);
                }
                const binanceSymbol = toBinanceSymbol(gdaxProduct);
                this.binanceInstance.orderStatus(binanceSymbol, id, (error: any, response: BinanceOpenOrderResponse) => {
                    if (checkResponseError('loading order status', error, reject)) {
                        return;
                    }
                    resolve(convertBinanceOrderToGdaxOrder(response));
                });
            });
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

            return new Promise<LiveOrder[]>((resolve, reject) => {
                binanceFunction(binanceSymbol, (error: any, allOrders: BinanceAllOrders) => {
                    if (checkResponseError('loading all orders', error, reject)) {
                        return;
                    }
                    const liveOrders: LiveOrder[] = [];
                    for (const iterator of allOrders) {
                        liveOrders.push(convertBinanceOrderToGdaxOrder(iterator));
                    }
                    resolve(liveOrders);
                });
            });
        });
    }

    loadBalances(): Promise<Balances> {
        return this.checkAuth().then(() => {
            return new Promise<Balances>((resolve, reject) => {
                this.binanceInstance.balance((error: any, response: BinanceBalances) => {
                    if (checkResponseError('loading balances', error, reject)) {
                        return;
                    }
                    if (response !== undefined) {
                        const balances: Balances = {};
                        const currentUser = 'USER';
                        balances[currentUser] = {};

                        for (const property in response) {
                            const available: AvailableBalance = {
                                available: Big(response[property].available),
                                balance: Big(response[property].onOrder),
                            };
                            balances[currentUser][property] = available;
                        }
                        resolve(balances);
                    } else {
                        reject(new Error('There is no available Balance for the current account.'));
                    }
                });
            });
        });
    }

    loadProducts(): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            this.binanceInstance.exchangeInfo((error: any, response: BinanceExchangeInformation) => {
                if (checkResponseError('loading products', error, reject)) {
                    return;
                }
                const products: Product[] = [];
                for (const iterator of response.symbols) {
                    const product = convertBinanceProductToGdaxProduct(iterator);
                    products.push(product);
                }
                resolve(products);
            });

        });
    }

    loadMidMarketPrice(gdaxProduct: string): Promise<BigJS> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        return new Promise<BigJS>((resolve, reject) => {
            this.binanceInstance.prevDay(binanceSymbol, (error: any, response: BinanceSymbolPrice) => {
                if (checkResponseError('load mid market price', error, reject)) {
                    return;
                }
                const midMarketPrice = Big(response.bidPrice).plus(Big(response.askPrice)).times(0.5);
                resolve(midMarketPrice);
            });
        });
    }

    loadOrderbook(gdaxProduct: string): Promise<BookBuilder> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        return new Promise<BookBuilder>((resolve, reject) => {
            this.binanceInstance.depth(binanceSymbol, (error: any, data: BinanceOrderBook) => {
                if (checkResponseError('loading order book', error, reject)) {
                    return;
                }
                const book = convertBinanceOrderBookToGdaxBook(data, this.logger);
                resolve(book);
            });
        }).then((book: BookBuilder) => {
            return Promise.resolve(book);
        }).catch((err: Error) => {
            return Promise.reject(new GTTError('Error loading ' + binanceSymbol + ' order book from Binance', err));
        });
    }

    loadTicker(gdaxProduct: string): Promise<Ticker> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        return new Promise<Ticker>((resolve, reject) => {
            this.binanceInstance.prevDay(binanceSymbol, (error: any, response: Binance24Ticker) => {
                if (checkResponseError('loading ticker', error, reject)) {
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
                };
                resolve(ticker);
            });
        }).then((ticker: Ticker) => {
            return Promise.resolve(ticker);
        }).catch((err: Error) => {
            return Promise.reject(new GTTError('Error loading ' + binanceSymbol + ' ticker from Binance', err));
        });
    }

    loadCandles(options: CandleRequestOptions): Promise<Candle[]> {
        const binanceSymbol = BinanceExchangeAPI.product(options.gdaxProduct);
        const candleSticksOptions = {
            limit: options.limit || 500,
            endTime: options.from || undefined,
        };
        const promise: Promise<Candle[]> = new Promise<Candle[]>((resolve, reject) => {
            this.binanceInstance.candlesticks(binanceSymbol, options.interval, (error: any, ticks: any) => {
                if (checkResponseError('loading candles', error, reject)) {
                    return;
                }
                const candleList: Candle[] = [];
                for (const iterator of ticks) {
                    const [time, open, high, low, close, volume] = iterator;
                    const candle: Candle = {
                        timestamp: new Date(time),
                        close: Big(close),
                        high: Big(high),
                        low: Big(low),
                        open: Big(open),
                        volume: Big(volume),
                    };
                    candleList.push(candle);
                }
                // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
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
}
