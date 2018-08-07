/* tslint:disable */
import * as assert from 'assert';
import BinanceFeed, { BinanceExchangeFeedConfig } from '../../src/exchanges/binance/BinanceFeed';
import { BinanceOptions } from '../../src/exchanges/binance/BinanceAuth';
import { ExchangeAuthConfig } from '../../src/exchanges/AuthConfig';

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

describe('The Binance Feed', () => {

    const config: BinanceExchangeFeedConfig = {
        auth: auth,
        logger: undefined,
        wsUrl: 'wss://stream.binance.com:9443/ws/',
        options: opt
    }
    const binanceFeed = new BinanceFeed(config);

    it('check connectivity', () => {
        assert.equal(binanceFeed.isConnected, true);
        //assert.equal(binanceFeed.isPaused, false);
    });

    it('stream trade', function (this: Mocha.IContextDefinition, done) {
        binanceFeed.subscribe('trade', 'BNB-BTC');
        this.timeout(TIMEOUT);
        done();
    });


});


