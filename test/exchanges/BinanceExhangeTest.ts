/* tslint:disable */

const assert = require('assert');
//const nock = require('nock');

import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
import { CandleRequestOptions, Ticker } from '../../src/exchanges/PublicExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { BinanceWebsocketAPI } from '../../src/exchanges/binance/BinanceWebsocketAPI';
import { MochaDone } from './MochaDone';
import { BinanceCandlesticks } from '../../src/exchanges/binance/BinanceWebsocketInterfaces';
import { BookBuilder } from '../../src/lib';

const TIMEOUT = 10000;

//const BASE_ENDPOINT = 'https://api.binance.com'

const opt: BinanceOptions = {
    test: false,
    verbose: true,
    useServerTime: true,
    reconnect: true,
    log: (message: string) => { console.log(message) }
};

const auth: ExchangeAuthConfig = {
    key: 'HQsenetGsY1Fd18WScDbFE6CCaoEeenC1wpdAr5U1D5gYVOPq1fG1G2zztU42CkK',
    secret: 'LNnGabe6uHbaQpZc9G9Rsy7PzUiwhGSow4qSPWdbEcrmYfdJzHCfjVnSX52PyVMf'
}

describe('The Binance Exchange - WebSocket API', () => {
    const config: BinanceConfig = { options: opt, auth: auth };
    const binanceWS = new BinanceWebsocketAPI(config);

    describe('stream bookticker', function () {
        let bookticker: any;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            let doneWrapper = new MochaDone(done);
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamTicker('BNB-BTC');
            obs.subscribe((ticker) => {
                bookticker = ticker;
                doneWrapper.trigger();
                binanceWS.stopStream('ticker', 'BNB-BTC');
            });
        });

        it('bookticker result', () => {
            assert(typeof bookticker === 'object');
        });
    });

    describe('stream candlesticks', function () {
        let candlestick: BinanceCandlesticks;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            let doneWrapper = new MochaDone(done);
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamCandlesticks('BNB-BTC', '1m');
            obs.subscribe((candles) => {
                candlestick = candles;
                doneWrapper.trigger();
                binanceWS.stopStream('candlestick', 'BNB-BTC');
            });
        });

        it('candlestick result', () => {
            assert(typeof candlestick === 'object');
        });
    });

    describe('stream orderbook', function () {
        let bookBuilder: BookBuilder;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            let doneWrapper = new MochaDone(done);
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamOrderbook('BNB-BTC');
            obs.subscribe((book) => {
                bookBuilder = book;
                doneWrapper.trigger();
                binanceWS.stopStream('orderbook', 'BNB-BTC');
            });
        });

        it('orderbook result', () => {
            assert(typeof bookBuilder === 'object');
            console.log('   asks Total: ' + bookBuilder.asksTotal.toString());
            console.log('   asks value total: ' + bookBuilder.asksValueTotal.toString());
            console.log('   bids total: ' + bookBuilder.bidsTotal.toString());
            console.log('   bids value total: ' + bookBuilder.bidsValueTotal.toString());
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
            console.log('   asks Total: ' + book.asksTotal.toString());
            console.log('   asks value total: ' + book.asksValueTotal.toString());
            console.log('   bids total: ' + book.bidsTotal.toString());
            console.log('   bids value total: ' + book.bidsValueTotal.toString());
            done();
        });
    });

});

