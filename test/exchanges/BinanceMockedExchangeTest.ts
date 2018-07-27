/* tslint:disable */
import * as nock from 'nock';
import * as assert from 'assert';
//import * as crypto from 'crypto';
import { BinanceConfig, BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { BinanceExchangeAPI } from '../../src/exchanges/binance/BinanceExchangeAPI';
import { Balances } from '../../src/exchanges/AuthenticatedExchangeAPI';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';
import { PlaceOrderMessage } from '../../src/core';
import { LiveOrder } from '../../src/lib';
import { BinanceOrderResponse, BinanceProduct } from '../../src/exchanges/binance/BinanceMessages';
import { Product } from '../../src/exchanges/PublicExchangeAPI';

const BASE_ENDPOINT = 'https://api.binance.com/api/';
const VERBOSE_NOCK = false;

/***************************************************************
 *  BINANCE CONFIG
 ***************************************************************/

const opt: BinanceOptions = {
    test: true,
    verbose: false,
    useServerTime: true,
    log: (message: string) => { console.log(message) }
};

const auth: ExchangeAuthConfig = {
    key: 'HQsenetGsY1Fd18WScDbFE6CCaoEeenC1wpdAr5U1D5gYVOPq1fG1G2zztU42CkK',
    secret: 'LNnGabe6uHbaQpZc9G9Rsy7PzUiwhGSow4qSPWdbEcrmYfdJzHCfjVnSX52PyVMf'
}

/***************************************************************
 *  DEMO REQUEST ANSWERS 
 ***************************************************************/

const BinanceProductsDemo = {
    timezone: 'UTC',
    serverTime: 1508631584636,
    rateLimits: [{
        rateLimitType: 'REQUESTS_WEIGHT',
        interval: 'MINUTE',
        limit: 1200
    },
    {
        rateLimitType: 'ORDERS',
        interval: 'SECOND',
        limit: 10
    },
    {
        rateLimitType: 'ORDERS',
        interval: 'DAY',
        limit: 100000
    }
    ],
    exchangeFilters: ['empty'],
    symbols: [{
        symbol: 'ETHBTC',
        status: 'TRADING',
        baseAsset: 'ETH',
        baseAssetPrecision: 8,
        quoteAsset: 'BTC',
        quotePrecision: 8,
        orderTypes: ['LIMIT', 'MARKET'],
        icebergAllowed: false,
        filters: [{
            filterType: 'PRICE_FILTER',
            minPrice: '0.00000100',
            maxPrice: '100000.00000000',
            tickSize: '0.00000100'
        }, {
            filterType: 'LOT_SIZE',
            minQty: '0.00100000',
            maxQty: '100000.00000000',
            stepSize: '0.00100000'
        }, {
            filterType: 'MIN_NOTIONAL',
            minNotional: '0.00100000'
        }]
    }]
}

/** used by binance.loadBalance */
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

/** used by binance.placeOrder */
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

const BinanceOpenOrder = {
    symbol: 'LTCBTC',
    orderId: 1,
    clientOrderId: 'myOrder1',
    price: '0.1',
    origQty: '1.0',
    executedQty: '0.0',
    cummulativeQuoteQty: '0.0',
    status: 'NEW',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: 'BUY',
    stopPrice: '0.0',
    icebergQty: '0.0',
    time: 1499827319559,
    updateTime: 1499827319559,
    isWorking: true
}

const BinanceAllOpenOrders = [
    BinanceOpenOrder
]

const BinanceCancelOrderResponse = {
    symbol: "LTCBTC",
    origClientOrderId: "myOrder1",
    orderId: 1,
    clientOrderId: "cancelMyOrder1"
}

const BinanceCancelOrderResponse2 = {
    symbol: "LTCBTC",
    origClientOrderId: "myOrder2",
    orderId: 1234,
    clientOrderId: "cancelMyOrder2"
}

const BinanceAllOpenOrdersToCancel = [
    BinanceCancelOrderResponse,
    BinanceCancelOrderResponse2
]

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
    let nockScope = nock(BASE_ENDPOINT + baseEndpoint)
        .filteringPath(filterPath);

    if (VERBOSE_NOCK) {
        nockScope.log(console.log);
    }
    return nockScope;
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

    it('[MOCKED] load products', function (this: Mocha.IContextDefinition, done) {

        const firstProduct = BinanceProductsDemo.symbols[0];

        // public request!
        nock(BASE_ENDPOINT)
            .get('/v1/exchangeInfo')
            .reply(200, JSON.stringify(BinanceProductsDemo));

        binance.loadProducts().then((products: Product[]) => {
            assert(Array.isArray(products));
            const p = products[0];
            assert.equal(p.sourceId, firstProduct.symbol);
            assert.equal(p.id, 'ETH-BTC');
            assert.equal(p.quoteCurrency, firstProduct.quoteAsset);
            assert.equal(p.baseCurrency, firstProduct.baseAsset);
            assert.equal((<BinanceProduct>p.sourceData).icebergAllowed, firstProduct.icebergAllowed);
            assert.equal((<BinanceProduct>p.sourceData).status, firstProduct.status);
            assert.deepEqual((<BinanceProduct>p.sourceData).filters[0], firstProduct.filters[0]);
            done();
        }).catch((err: Error) => {
            console.error(err);
        })

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

    it('[MOCKED] place market order', function (this: Mocha.IContextDefinition, done) {

        const order: PlaceOrderMessage = {
            productId: 'BNBBTC',
            orderType: 'limit',
            side: 'buy',
            time: new Date(Date.now()),
            type: 'placeOrder',
            size: '5',
            price: '10'
        }

        let parameters = {
            symbol: order.productId,
            side: order.side.toUpperCase(),
            type: order.orderType.toUpperCase(),
            quantity: order.size,
            price: order.price,
            timeInForce: 'GTC'
        };

        let nockScope = buildNockRequest();

        if (opt.alwaysUseServerTime === true) {
            nockScope.get('/v1/time')
            .reply(200, 12345678912345678910);
        }

        nockScope.post('/v3/order' + ((opt.test) ? '/test' : '') + buildEndpoint(parameters))
            .reply(200, JSON.stringify(BinanceLimitBuyResponse));

        binance.placeOrder(order).then((liveOrder: LiveOrder) => {
            assert(typeof liveOrder === 'object');
            assert.equal(liveOrder.status, BinanceLimitBuyResponse.status);
            assert.equal(liveOrder.extra.clientOrderId, BinanceLimitBuyResponse.clientOrderId);
            assert.equal(liveOrder.productId, BinanceLimitBuyResponse.symbol);
            assert.equal(liveOrder.id, BinanceLimitBuyResponse.orderId.toString());
            done();
        });
    });

    it('[MOCKED] get all open orders by symbol', function (this: Mocha.IContextDefinition, done) {

        let parameters = {
            symbol: 'LTCBTC'
        };

        buildNockRequest('v3/allOrders')
            .get(buildEndpoint(parameters))
            .reply(200, JSON.stringify(BinanceAllOpenOrders));

        binance.loadAllOrders('LTCBTC').then((liveOrders: LiveOrder[]) => {
            assert(Array.isArray(liveOrders));
            assert(liveOrders.length > 0);
            const testLiveOrder = liveOrders[0];
            assert.equal(testLiveOrder.id, BinanceAllOpenOrders[0].orderId.toString());
            assert.equal(testLiveOrder.extra.clientOrderId, BinanceAllOpenOrders[0].clientOrderId);
            assert.equal(testLiveOrder.extra.isWorking, BinanceAllOpenOrders[0].isWorking);
            done();
        });

    });

    it('[MOCKED] get all open orders', function (this: Mocha.IContextDefinition, done) {

        buildNockRequest('v3/openOrders')
            .get(buildEndpoint())
            .reply(200, JSON.stringify(BinanceAllOpenOrders));

        binance.loadAllOrders().then((liveOrders: LiveOrder[]) => {
            assert(Array.isArray(liveOrders));
            assert(liveOrders.length > 0);
            const testLiveOrder = liveOrders[0];
            assert.equal(testLiveOrder.id, BinanceAllOpenOrders[0].orderId.toString());
            assert.equal(testLiveOrder.extra.clientOrderId, BinanceAllOpenOrders[0].clientOrderId);
            assert.equal(testLiveOrder.extra.isWorking, BinanceAllOpenOrders[0].isWorking);
            done();
        });

    });

    it('[MOCKED] get order status', function (this: Mocha.IContextDefinition, done) {

        const loadOrderParameters = {
            symbol: 'LTCBTC',
            orderId: BinanceOpenOrder.orderId
        };

        buildNockRequest('v3/order')
            .get(buildEndpoint(loadOrderParameters))
            .reply(200, JSON.stringify(BinanceOpenOrder));

        binance.loadOrder(loadOrderParameters.orderId, loadOrderParameters.symbol).then((liveOrder: LiveOrder) => {
            assert.equal(liveOrder.id, BinanceOpenOrder.orderId.toString());
            assert.equal(liveOrder.extra.clientOrderId, BinanceOpenOrder.clientOrderId);
            assert.equal(liveOrder.extra.isWorking, BinanceOpenOrder.isWorking);
            done();
            return Promise.resolve();
        });

    });

    it('[MOCKED] cancel order', function (this: Mocha.IContextDefinition, done) {

        const cancelOrderParameters = {
            symbol: 'LTCBTC',
            orderId: BinanceOpenOrder.orderId
        };

        buildNockRequest()
            .delete('/v3/order' + buildEndpoint(cancelOrderParameters))
            .reply(200, JSON.stringify(BinanceCancelOrderResponse))

        binance.cancelOrder(cancelOrderParameters.orderId.toString(10), cancelOrderParameters.symbol).then((answer: string) => {
            assert.equal(answer, BinanceCancelOrderResponse.orderId.toString(10));
            done();
            return Promise.resolve();
        });

    });

    it('[MOCKED] cancel all orders', function (this: Mocha.IContextDefinition, done) {

        const cancelAllOrdersParameters = {
            symbol: 'LTCBTC',
        };

        // nock chaining
        buildNockRequest()
            .get('/v3/openOrders' + buildEndpoint(cancelAllOrdersParameters))
            .reply(200, JSON.stringify(BinanceAllOpenOrdersToCancel))
            .delete('/v3/order' + buildEndpoint({ symbol: 'LTCBTC', orderId: BinanceCancelOrderResponse.orderId }))
            .reply(200, JSON.stringify(BinanceCancelOrderResponse))
            .delete('/v3/order' + buildEndpoint({ symbol: 'LTCBTC', orderId: BinanceCancelOrderResponse2.orderId }))
            .reply(200, JSON.stringify(BinanceCancelOrderResponse2))

        binance.cancelAllOrders(cancelAllOrdersParameters.symbol).then((answer: string[]) => {
            assert(Array.isArray(answer));
            assert(answer.length === 2);
            assert.equal(answer[0], BinanceCancelOrderResponse.orderId.toString(10))
            assert.equal(answer[1], BinanceCancelOrderResponse2.orderId.toString(10))
            done();
            return Promise.resolve();
        });

    });


});