/* tslint:disable */

const assert = require('assert');
//const nock = require('nock');

//import request = require('superagent');
import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
//import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
//import { HTTPError, extractResponse } from '../../src/lib/errors';
//import { Big } from '../../src/lib/types';
//import Response = request.Response;
//import { BinanceBookTicker } from '../../src/exchanges/binance/BinanceCommon';
import { CandleRequestOptions } from '../../src/exchanges/PublicExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { BinanceWebsocketAPI } from '../../src/exchanges/binance/BinanceWebsocketAPI';

const TIMEOUT = 10000;

//const BASE_ENDPOINT = 'https://api.binance.com'




const opt: BinanceOptions = {
    test: true,
    verbose: true,
    useServerTime: true,
    reconnect: true,
    log: (message: string) => { console.log(message) }
};

const auth: ExchangeAuthConfig = {
    key: 'HQsenetGsY1Fd18WScDbFE6CCaoEeenC1wpdAr5U1D5gYVOPq1fG1G2zztU42CkK',
    secret: 'LNnGabe6uHbaQpZc9G9Rsy7PzUiwhGSow4qSPWdbEcrmYfdJzHCfjVnSX52PyVMf'
}

const stopSockets = (binance: BinanceExchangeAPI) => {
    let endpoints = binance.api.websockets.subscriptions();
    for (let endpoint in endpoints) {
        //if (log) console.log('Terminated ws endpoint: ' + endpoint);
        binance.api.websockets.terminate(endpoint);
    }
}

// const demoTicker = {
//   symbol: 'BNBBTC',
//   bidPrice: '0.1',
//   bidQty: '44.125000000',
//   askPrice: '20.5',
//   askQty: '187.2915'
// };

// describe('The Binance exchange API - Mocked REST Requests', () => {
//     it('loads mocked book ticker', () => {
//         const endpoint = '/api/v3/ticker/bookTicker?symbol=BNBBTC';
//         nock(BASE_ENDPOINT)
//         .get(endpoint)
//         .reply(200, demoTicker);

//         // raw rest request
//         const promise = request.get(`${BASE_ENDPOINT}${endpoint}`)
//         .accept('application/json')
//         .then((res: Response) => {
//             if (res.status !== 200) {
//                 return Promise.reject(new HTTPError('Error loading ticker from Binance', extractResponse(res)));
//             }
//             const bookTicker: BinanceBookTicker = res.body;
//             return Promise.resolve({
//                 productId: bookTicker.symbol,
//                 ask: Big(bookTicker.askPrice),
//                 bid: Big(bookTicker.bidPrice),
//                 price: Big(0),
//                 volume: Big(0),
//                 time: new Date(Date.now() * 1000)
//             });
//         });



//         return promise.then((ticker:Ticker) => {
//             assert(ticker.ask.eq(demoTicker.askPrice));
//             assert(ticker.bid.eq(demoTicker.bidPrice));
//             nock.cleanAll();
//         })

//     });



// });

describe('The Binance WebSocket Exchange API', () => {
    const config: BinanceConfig = { options: opt, auth: auth };
    const binanceWS = new BinanceWebsocketAPI(config);

    describe('Websocket - loads bookticker', function () {
        let bookticker: any;
        beforeEach(function (this: Mocha.IContextDefinition, done) {
            this.timeout(TIMEOUT);
            let obs = binanceWS.streamTicker('BNB-BTC');
            obs.subscribe((ticker) => {
                bookticker = ticker;
                binanceWS.stopAllStreams();
                done();
            })
        });

        it('', () => {
            assert(typeof bookticker === 'object');
        });
    });

   
});


describe('The Binance Exchange API', () => {
    const config: BinanceConfig = { options: opt, auth: auth };
    const binance = new BinanceExchangeAPI(config);

    describe('[old] Websocket - loads bookticker', function () {
        let bookticker: any;
        beforeEach(function (this: Mocha.IContextDefinition, done) {
            this.timeout(TIMEOUT);
            binance.loadTicker('BNB-BTC').then((ticker) => {
                bookticker = ticker;

                stopSockets(binance);
                done();
            });
        });

        it('', () => {
            assert(typeof bookticker === 'object');
        });
    });

    describe('Websocket - loads candlesticks', function () {
        let candlestick: any;
        beforeEach(function (this: Mocha.IContextDefinition, done) {
            const candlesOptions: CandleRequestOptions = {
                from: new Date(Date.now()),
                gdaxProduct: 'BNB-BTC',
                interval: '5m',
                limit: 500
            }

            this.timeout(TIMEOUT);

            binance.loadCandles(candlesOptions).then((candles) => {
                candlestick = candles;
                done();
                stopSockets(binance);
            });
        });

        it('', () => {
            assert(candlestick);
            assert(Array.isArray(candlestick));
        })
    });

    describe('Websocket - loads orderbook', function () {

        let bookbuilder: any;

        beforeEach(function (this: Mocha.IContextDefinition, done) {
            binance.loadOrderbook('BNB-BTC').then((book) => {
                bookbuilder = book;
                stopSockets(binance);
                done();
            });
            this.timeout(TIMEOUT);
        });

        it('', () => {
            assert(bookbuilder)
        });
    });

});