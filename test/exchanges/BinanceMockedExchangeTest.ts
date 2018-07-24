/* tslint:disable */
import * as nock from 'nock';
import * as assert from 'assert';
//import * as crypto from 'crypto';
import { BinanceConfig, BinanceOptions } from "../../src/exchanges/binance/BinanceAuth";
import { BinanceExchangeAPI } from "../../src/exchanges/binance/BinanceExchangeAPI";
import { Balances } from '../../src/exchanges/AuthenticatedExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { PlaceOrderMessage } from '../../src/core';
import { LiveOrder } from '../../src/lib';
import { BinanceOrderResponse } from '../../src/exchanges/binance/BinanceMessages';

const TIMEOUT = 10000;
const BASE_ENDPOINT = 'https://api.binance.com/api/';

/***************************************************************
 *  BINANCE CONFIG
 ***************************************************************/

const opt: BinanceOptions = {
    test: true,
    verbose: false,
    useServerTime: true,
    alwaysUseServerTime: false, // <- important to set to false
};

const auth: ExchangeAuthConfig = {
    key: 'HQsenetGsY1Fd18WScDbFE6CCaoEeenC1wpdAr5U1D5gYVOPq1fG1G2zztU42CkK',
    secret: 'LNnGabe6uHbaQpZc9G9Rsy7PzUiwhGSow4qSPWdbEcrmYfdJzHCfjVnSX52PyVMf'
}

/***************************************************************
 *  DEMO REQUEST ANSWERS 
 ***************************************************************/

const BinanceBalanceDemo = {
    balances: [
        { asset: 'BTC', free: '0.77206464', locked: '0.00177975' },
        { asset: 'LTC', free: '0.00000000', locked: '0.00000000' },
        { asset: 'ETH', free: '1.14109900', locked: '0.00000000' },
        { asset: 'BNC', free: '0.00000000', locked: '0.00000000' },
        { asset: 'ICO', free: '0.00000000', locked: '0.00000000' },
        { asset: 'NEO', free: '0.00000000', locked: '0.00000000' },
        { asset: 'BNB', free: '41.33761879', locked: '0.00000000' },
    ]
}

const BinanceLimitBuyResponse: BinanceOrderResponse = {
    symbol: 'BNBETH',
    orderId: 4480717,
    clientOrderId: 'te38xGILZUXrPZHnTQPH6h',
    transactTime: 1509049732437,
    price: '0.00402030',
    origQty: '5.00000000',
    executedQty: '5.00000000',
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: 'BUY'
}

/***************************************************************
 *  HELPER FUNCTIONS 
 ***************************************************************/

let commonEndPointData: any = {
    'timestamp': '12345678910111213141',
    'recvWindow': opt.recvWindow || 5000
}

function buildEndpoint(data?: any) {

    if (data === undefined) data = {};

    data.timestamp = commonEndPointData.timestamp;
    data.recvWindow = commonEndPointData.recvWindow;

    let query = Object.keys(data).reduce(
        function (a, k) {
            a.push(k + '=' + encodeURIComponent(data[k]));
            return a;
        }, [])
        .join('&');

    return '?' + query + '&signature=MY_SECRET_API_KEY'
}

function filterPath(path: string): string {
    path = path.replace(/timestamp=([0-9]{1,20}|NaN)/g, 'timestamp=12345678910111213141')
        .replace(/&signature=[^&]*/g, '&signature=MY_SECRET_API_KEY')
    return path;
}

function buildNockRequest(baseEndpoint: string = ''): nock.Scope {
    return nock(BASE_ENDPOINT + baseEndpoint)
        .log(console.log)
        .filteringPath(filterPath);
}

/***************************************************************
 *  THE TEST FUNCTIONS 
 ***************************************************************/

describe('The Binance Mocked Exchange - MOCKED REST API', () => {

    const config: BinanceConfig = { options: opt, auth: auth };
    const binance = new BinanceExchangeAPI(config);

    afterEach(() => {
        nock.cleanAll();
    });

    it('[MOCKED] load balances', function (this: Mocha.IContextDefinition, done) {
        //let signature = crypto.createHmac('sha256', auth.secret).update(query).digest('hex'); // set the HMAC hash header
        buildNockRequest('v3/account')
            .get(buildEndpoint())
            .reply(200, JSON.stringify(BinanceBalanceDemo));

        binance.loadBalances().then((balances: Balances) => {
            assert(typeof balances === 'object');
            assert.equal(balances['USER']['BTC'].available.toString(10), BinanceBalanceDemo.balances[0].free);
            assert.equal(balances['USER']['ETH'].available.toString(10).concat('00'), BinanceBalanceDemo.balances[2].free);
            done();
        }).catch((err: Error) => {
            console.error(err);
        })

    });

    it('[MOCKED] market place order', function (this: Mocha.IContextDefinition, done) {

        this.timeout(TIMEOUT);

        const order: PlaceOrderMessage = {
            productId: 'BNBBTC',
            orderType: 'limit',
            side: 'buy',
            time: new Date(Date.now()),
            type: 'placeOrder',
            size: '5',
            price: '10'
        }

        let endPointData = {
            symbol: order.productId,
            side: order.side.toUpperCase(),
            type: order.orderType.toUpperCase(),
            quantity: order.size,
            price: order.price,
            timeInForce: 'GTC'
        };

        buildNockRequest('v3/order' + ((opt.test) ? '/test' : ''))
            .post(buildEndpoint(endPointData))
            .reply(200, JSON.stringify(BinanceLimitBuyResponse));

        binance.placeOrder(order).then((liveOrder: LiveOrder) => {
            assert(typeof liveOrder === 'object');
            done();
        });
    });



});