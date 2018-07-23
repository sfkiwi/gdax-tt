/* tslint:disable */

import { ExchangeAuthConfig } from '../AuthConfig';
import { Logger } from '../../utils';
import { PlaceOrderMessage } from '../../core';
import { toBinanceSymbol } from './BinanceCommon';
import { LiveOrder } from '../../lib';
import { BinanceOrderResponse } from './BinanceMessages';
import { Big } from '../../lib/types';
const Binance = require('node-binance-api');

export interface BinanceLoggerCallback { (message: string): void }

/**
 * Binance API options interface
 */
export interface BinanceOptions {
    /**
     * Specify that the request must be processed within a certain number of milliseconds or be rejected by the server
     * Set a higher recvWindow to increase response timeout
     * It's recommended to use a small recvWindow of 5000 or less.
     */
    recvWindow?: number;
    /**
     * If true, synchronizes to server time at startup to solve timestamp errors
     */
    useServerTime?: boolean;
    /**
     * If true, for each signed request operation first synchronizes to server time then it will send the request itself.
     * This option tries to avoid timestamp errors.
     */
    alwaysUseServerTime?: boolean;
    /**
     * Should WebSockets reconnect?
     */
    reconnect?: boolean;
    /**
     * Adds extra output when subscribing to WebSockets, etc
     */
    verbose?: boolean;
    /**
     * Sandbox simulation.
     * If you want to use sandbox mode where orders are simulated, mark this option to true.
     */
    test?: boolean;
    /**
     * Logger function
     * You can create your own logger here, or disable console output
     */
    log?: BinanceLoggerCallback;
}

export interface BinanceConfig {
    /**
     * Binance API options
     */
    options?: BinanceOptions;
    /**
     * Binance Authentication configuration
     */
    auth?: ExchangeAuthConfig;

    logger?: Logger;
}


export function createBinanceInstance(auth: ExchangeAuthConfig, options?: BinanceOptions) {

    const key = (auth && auth.key) ? auth.key : '';
    const secret = (auth && auth.secret) ? auth.secret : '';

    const binanceOptions = {
        ...{
            APIKEY: key,
            APISECRET: secret
        }
        , ...options
    };



    return new Binance().options(binanceOptions);
}



export function placeOrder(order: PlaceOrderMessage, binanceAPI: any): Promise<LiveOrder> {

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
            /**
             * Creates an order
              * @param {string} side - BUY or SELL
              * @param {string} symbol - the symbol to buy
              * @param {numeric} quantity - the quantity required
              * @param {numeric} price - the price to pay for each unit
              * @param {object} flags - additional buy order flags
              * @param {function} callback - the callback function
             */
            binanceAPI.order(side, binanceSymbol, quantity, price, flags, (error: any, response: BinanceOrderResponse) => {

                if (error) {
                    if (error.statusCode && error.statusCode !== 200) {
                        if (error.body) {
                            const errorBody = JSON.parse(error.body);
                            reject(new Error('Error placing order from Binance.\nCode: ' + errorBody.code.toString() + '\nMessage: ' + errorBody.msg))
                            return;
                        }
                    }

                    reject(new Error('An error occurred during the place order from Binance: ' + error));
                    return;
                }

                const liveOrder: LiveOrder = {
                    productId: binanceSymbol,
                    id: (response.orderId) ? response.orderId.toString() : undefined,
                    price: Big(response.price),
                    side: (response.side === 'BUY') ? 'buy' : 'sell',
                    size: Big(response.executedQty),
                    status: response.status,
                    time: new Date(response.transactTime),
                    extra: {
                        clientOrderId: response.clientOrderId,
                        timeInForce: response.timeInForce,
                        type: response.type,
                    }
                }
                resolve(liveOrder);
            })
        };

        const use = binanceAPI.getOption('alwaysUseServerTime');
        if (use) {
            binanceAPI.useServerTime(() => {
                binancePlaceOrder();
            });
        } else {
            binancePlaceOrder();
        }
    });

}

// export function getCurrentOpenOrders(binanceAPI: any) {
//     binanceAPI.openOrders(false, (error: any, response: Array<BinanceOpenOrder>) => {
//     });
// }