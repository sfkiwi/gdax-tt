import { ExchangeAuthConfig } from '../AuthConfig';
import { Logger } from '../../utils';
const Binance = require('node-binance-api');

export type BinanceLoggerCallback = (message: string) => void;

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
            APISECRET: secret,
        }
        , ...options
    };
    return new Binance().options(binanceOptions);
}
