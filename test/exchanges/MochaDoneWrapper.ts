/* tslint:disable */
/**
 * Wrapper-Class for done-function
 * @param {Function} fn
 * @class {MochaDone}
 */
export class MochaDoneWrapper {

    public verbose: boolean = false;
    private called: boolean = false;
    private fn: () => void;

    constructor(fn: () => void) {
        this.fn = fn;
    }

    /**
     *
     * @param {*} params...
     */
    trigger(...params: any[]) {
        if (this.called) {
            if (this.verbose) {
                console.warn('done has already been called');
                console.trace();
            }
            return;
        }

        this.fn.apply(this, params);
        this.called = true;
    }
}
