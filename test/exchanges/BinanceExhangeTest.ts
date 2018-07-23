/* tslint:disable */

import * as nock from 'nock';
import * as assert from 'assert';
// import * as crypto from 'crypto';

import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
import { CandleRequestOptions, Ticker } from '../../src/exchanges/PublicExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { BinanceWebsocketAPI } from '../../src/exchanges/binance/BinanceWebsocketAPI';
import { MochaDone } from './MochaDone';
import { BinanceCandlesticks } from '../../src/exchanges/binance/BinanceWebsocketInterfaces';
import { BookBuilder, LiveOrder } from '../../src/lib';
import { PlaceOrderMessage } from '../../src/core';
import { Balances } from '../../src/exchanges/AuthenticatedExchangeAPI';

const TIMEOUT = 10000;
const BASE_ENDPOINT = 'https://api.binance.com';

const opt: BinanceOptions = {
    test: true,
    verbose: false,
    useServerTime: true,
    alwaysUseServerTime: true,
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
            let doneWrapper = new MochaDone(() => {
                binanceWS.stopStream('ticker', 'BNB-BTC');
                done()
            });
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamTicker('BNB-BTC');
            obs.subscribe((ticker) => {
                bookticker = ticker;
                doneWrapper.trigger();
            });
        });

        it('bookticker result', () => {
            assert(typeof bookticker === 'object');
        });
    });

    describe('stream candlesticks', function () {
        let candlestick: BinanceCandlesticks;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            let doneWrapper = new MochaDone(() => {
                binanceWS.stopStream('candlestick', 'BNB-BTC');
                done();
            });
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamCandlesticks('BNB-BTC', '1m');
            obs.subscribe((candles) => {
                candlestick = candles;
                doneWrapper.trigger();
            });
        });

        it('candlestick result', () => {
            assert(typeof candlestick === 'object');
        });
    });

    describe('stream orderbook', function () {
        let bookBuilder: BookBuilder;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            let doneWrapper = new MochaDone(() => {
                done();
                binanceWS.stopStream('orderbook', 'BNB-BTC');
            });
            this.timeout(TIMEOUT);

            let obs = binanceWS.streamOrderbook('BNB-BTC');
            obs.subscribe((book) => {
                bookBuilder = book;
                doneWrapper.trigger();  
            });
        });

        it('orderbook result', () => {
            assert(typeof bookBuilder === 'object');
            // console.log('   asks Total: ' + bookBuilder.asksTotal.toString());
            // console.log('   asks value total: ' + bookBuilder.asksValueTotal.toString());
            // console.log('   bids total: ' + bookBuilder.bidsTotal.toString());
            // console.log('   bids value total: ' + bookBuilder.bidsValueTotal.toString());
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
            // console.log('   asks Total: ' + book.asksTotal.toString());
            // console.log('   asks value total: ' + book.asksValueTotal.toString());
            // console.log('   bids total: ' + book.bidsTotal.toString());
            // console.log('   bids value total: ' + book.bidsValueTotal.toString());
            done();
        });
    });

    it('market place order', function (this: Mocha.IContextDefinition, done) {
  
        this.timeout(TIMEOUT);

        const order: PlaceOrderMessage = {
            productId: 'BNBBTC',
            orderType: 'market',
            side: 'buy',
            time: new Date(Date.now()),
            type: 'placeOrder',
            size: '5',
            price: '10'
        }

        binance.placeOrder(order).then((liveOrder: LiveOrder) => {
            assert(liveOrder);
            assert(typeof liveOrder === 'object');
            done();
        });
    });

});


const BinanceBalanceDemo = {
    BTC: { available: '0.77206464', onOrder: '0.00177975' },
    LTC: { available: '0.00000000', onOrder: '0.00000000' },
    ETH: { available: '1.14109900', onOrder: '0.00000000' },
    BNC: { available: '0.00000000', onOrder: '0.00000000' },
    ICO: { available: '0.00000000', onOrder: '0.00000000' },
    NEO: { available: '0.00000000', onOrder: '0.00000000' },
    BNB: { available: '41.33761879', onOrder: '0.00000000' },
}

describe('The Binance Mocked Exchange - MOCKED REST API', () => {

    const config: BinanceConfig = { options: opt, auth: auth };
    const binance = new BinanceExchangeAPI(config);

    it('[MOCKED] load balances', function (this: Mocha.IContextDefinition, done) {

        // let data: any = {
        //     'timestamp': 'XXX'//new Date().getTime()
        // }
        //let query = Object.keys(data).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(data[k])); return a }, []).join('&');
        //let signature = crypto.createHmac('sha256', auth.secret).update(query).digest('hex'); // set the HMAC hash header
        //const endpoint = '/api/v3/account?' + query + '&signature=' + signature;
        const endpoint = '/api/v3/account?timestamp=123&recvWindow=5000&signature=API_SECRET_KEY';

        nock(BASE_ENDPOINT)
            .filteringPath(/\?timestamp=\d*/g, '?timestamp=123')
            .filteringPath(/\&signature=[^&]*/g, '&signature=API_SECRET_KEY')
            .get(endpoint)
            .reply(200, BinanceBalanceDemo);

        binance.loadBalances().then((balance: Balances) => {
            assert(balance);
            done();
        });

    });

});