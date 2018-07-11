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
import { PRODUCT_MAP, BinanceBookTicker } from './BinanceCommon';

export class BinanceExchangeAPI implements PublicExchangeAPI, AuthenticatedExchangeAPI, ExchangeTransferAPI {

    owner: string = 'Binance';
    private readonly auth: ExchangeAuthConfig;
    private binanceInstance: any;
    // private readonly config : BinanceConfig;

    constructor(config: BinanceConfig) {
        // this.config = config;
        this.auth = config.auth && config.auth.key && config.auth.secret ? config.auth : undefined;
        this.binanceInstance = createBinanceInstance(this.auth, config.options);
        console.log(config);
        // } catch (err) {
        //     throw new Error('Could not create BinanceExchangeAPI: ' + err);
        // }
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
        throw new Error('Method not implemented.');
    }

    loadTicker(gdaxProduct: string): Promise<Ticker> {
        const binanceSymbol = BinanceExchangeAPI.product(gdaxProduct);
        const promise : Promise<Ticker> = new Promise<Ticker>((resolve, reject) => {
            this.binanceInstance.bookTickers(binanceSymbol, (error: any, response: BinanceBookTicker) => {               
                if (error) {
                    console.log(error);
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
                    ask: Big(response.askPrice),
                    price: Big(response.bidPrice),
                    bid: Big(response.bidPrice),
                    time: new Date(Date.now())
                }
                console.log(ticker);

                resolve(ticker);
            });
        })
        .then((ticker:Ticker) => {
            return Promise.resolve(ticker);
        })
        .catch((err : Error) => {
            return Promise.reject(new GTTError('Error loading ' + gdaxProduct + ' ticker from Binance', err));
        });

        return promise;
    }

    loadCandles(options: CandleRequestOptions): Promise<Candle[]> {
        throw new Error('Method not implemented.');
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
