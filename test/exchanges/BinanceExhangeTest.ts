/* tslint:disable */
import * as assert from 'assert';
import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
import { CandleRequestOptions, Ticker, Product } from '../../src/exchanges/PublicExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { BinanceWebsocketAPI } from '../../src/exchanges/binance/BinanceWebsocketAPI';
import { MochaDoneWrapper } from './MochaDoneWrapper';
import { BinanceCandlesticks } from '../../src/exchanges/binance/BinanceWebsocketInterfaces';
import { BookBuilder } from '../../src/lib';
import { BigJS } from '../../src/lib/types';
import { CryptoAddress } from '../../src/exchanges/ExchangeTransferAPI';

const TIMEOUT = 10000;

const opt: BinanceOptions = {
    test: true,
    verbose: false,
    useServerTime: true,
    alwaysUseServerTime: true,
    reconnect: true,
    //log: (message: string) => { console.log(message) }
};

const auth: ExchangeAuthConfig = {
    key: 'HQsenetGsY1Fd18WScDbFE6CCaoEeenC1wpdAr5U1D5gYVOPq1fG1G2zztU42CkK',
    secret: 'LNnGabe6uHbaQpZc9G9Rsy7PzUiwhGSow4qSPWdbEcrmYfdJzHCfjVnSX52PyVMf'
}

describe('The Binance Exchange - WebSocket API', () => {
    const config: BinanceConfig = { options: opt, auth: auth };
    const binanceWS = new BinanceWebsocketAPI(config);

    it('stream bookticker', function (this: Mocha.IContextDefinition, done) {

        let bookticker: any;

        let doneWrapper = new MochaDoneWrapper(() => {
            binanceWS.stopStream('ticker', 'BNB-BTC');
            assert(typeof bookticker === 'object');
            done();
        });
        this.timeout(TIMEOUT);

        let obs = binanceWS.streamTicker('BNB-BTC');
        obs.subscribe((ticker) => {
            bookticker = ticker;
            doneWrapper.trigger();
        });
    });


    it('stream candlesticks', function (this: Mocha.IContextDefinition, done) {

        let candlestick: BinanceCandlesticks;

        let doneWrapper = new MochaDoneWrapper(() => {
            binanceWS.stopStream('candlestick', 'BNB-BTC');
            assert(typeof candlestick === 'object');
            done();
        });
        this.timeout(TIMEOUT);

        let obs = binanceWS.streamCandlesticks('BNB-BTC', '1m');
        obs.subscribe((candles) => {
            candlestick = candles;
            doneWrapper.trigger();
        });

    })

    it('stream orderbook', function (this: Mocha.IContextDefinition, done) {

        let bookBuilder: BookBuilder;

        let doneWrapper = new MochaDoneWrapper(() => {
            binanceWS.stopStream('orderbook', 'BNB-BTC');
            assert(typeof bookBuilder === 'object');
            done();
        });

        this.timeout(TIMEOUT);

        let obs = binanceWS.streamOrderbook('BNB-BTC');
        obs.subscribe((book) => {
            bookBuilder = book;
            doneWrapper.trigger();
        });
    });
});

describe('The Binance Exchange - REST API', () => {
    const config: BinanceConfig = { options: opt, auth: auth };
    const binance = new BinanceExchangeAPI(config);

    it('loads candles', function (this: Mocha.IContextDefinition, done) {
        const candlesOptions: CandleRequestOptions = {
            from: undefined,
            gdaxProduct: 'BNB-BTC',
            interval: '5m',
            limit: 500
        }

        this.timeout(TIMEOUT);

        binance.loadCandles(candlesOptions).then((candles) => {
            assert(candles);
            assert(Array.isArray(candles));
            done();
        });
    });

    it('loads bookticker', function (this: Mocha.IContextDefinition, done) {

        this.timeout(TIMEOUT);

        binance.loadTicker('BNB-BTC').then((ticker: Ticker) => {
            assert(ticker);
            assert(typeof ticker === 'object');
            done();
        });
    });

    it('loads orderbook', function (this: Mocha.IContextDefinition, done) {

        this.timeout(TIMEOUT);

        binance.loadOrderbook('BNB-BTC').then((book: BookBuilder) => {
            assert(book);
            assert(typeof book === 'object');
            done();
        });
    });
    
    it('loads products', function (this: Mocha.IContextDefinition, done) {

        this.timeout(TIMEOUT);

        binance.loadProducts().then((products:Product[]) => {
            assert(Array.isArray(products));
            done();
        });
    });

    it('loads mid market price', function (this: Mocha.IContextDefinition, done) {

        this.timeout(TIMEOUT);

        binance.loadMidMarketPrice('BNB-BTC').then((price:BigJS) => {
            assert(price);
            done();
        });
    });

    it('request crypto address', function (this: Mocha.IContextDefinition, done) {

        binance.requestCryptoAddress('ETH').then((result:CryptoAddress) => {
            assert(typeof result === 'object');
            assert.equal(result.currency, 'ETH');
            assert(result.address.length > 0);
            done();
            return Promise.resolve();
        });
    });

});




