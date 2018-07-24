/* tslint:disable */

import * as nock from 'nock';
import * as assert from 'assert';
//import * as crypto from 'crypto';

import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
import { CandleRequestOptions, Ticker } from '../../src/exchanges/PublicExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { BinanceWebsocketAPI } from '../../src/exchanges/binance/BinanceWebsocketAPI';
import { MochaDoneWrapper } from './MochaDoneWrapper';
import { BinanceCandlesticks } from '../../src/exchanges/binance/BinanceWebsocketInterfaces';
import { BookBuilder, LiveOrder } from '../../src/lib';
import { PlaceOrderMessage } from '../../src/core';
import { Balances } from '../../src/exchanges/AuthenticatedExchangeAPI';

const TIMEOUT = 10000;
const BASE_ENDPOINT = 'https://api.binance.com/api/';

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

        return binance.placeOrder(order).then((liveOrder: LiveOrder) => {
            assert(liveOrder);
            assert(typeof liveOrder === 'object');
            //done();
        });
    });

    
    after(() => {
        nock.cleanAll();
    });
});


const BinanceBalanceDemo = {
    balances: [
        {asset: 'BTC', free: '0.77206464', locked: '0.00177975' },
        {asset: 'LTC', free: '0.00000000', locked: '0.00000000' },
        {asset: 'ETH', free: '1.14109900', locked: '0.00000000' },
        {asset: 'BNC', free: '0.00000000', locked: '0.00000000' },
        {asset: 'ICO', free: '0.00000000', locked: '0.00000000' },
        {asset: 'NEO', free: '0.00000000', locked: '0.00000000' },
        {asset: 'BNB', free: '41.33761879', locked: '0.00000000' },
    ]
}

describe('The Binance Mocked Exchange - MOCKED REST API', () => {

    const config: BinanceConfig = { options: opt, auth: auth };
    const binance = new BinanceExchangeAPI(config);

    
    afterEach(() => {
        nock.cleanAll();
    });

    it('[MOCKED] load balances', function (this: Mocha.IContextDefinition, done) {

        let data: any = {
            'timestamp': '12345678910111213141',
            'recvWindow': config.options.recvWindow || 5000
        }
        let query = Object.keys(data).reduce(
            function (a, k) {
                a.push(k + '=' + encodeURIComponent(data[k])); 
                return a;
            }, [])
            .join('&');

        //let signature = crypto.createHmac('sha256', auth.secret).update(query).digest('hex'); // set the HMAC hash header
        const endpoint = '?' + query + '&signature=MY_SECRET_API_KEY';
        nock(BASE_ENDPOINT + 'v3/account')
            .log(console.log)
            .filteringPath((path: string) => {
                console.log('PATH: ' + path);
                path = path.replace(/timestamp=([0-9]{1,20}|NaN)/g,'timestamp=12345678910111213141')
                .replace(/&signature=[^&]*/g, '&signature=MY_SECRET_API_KEY')
                return path;
            })
            .get(endpoint)
            .reply(200, JSON.stringify(BinanceBalanceDemo));

        binance.loadBalances().then((balances: Balances) => {
            console.log(balances);
            //assert(balance);
            done();
        });

    });

});