const expect = require('expect');
const {Kernel} = require('./kernel');

describe('Kernel (kernel.js)',() => {
    it('should create a new instance', () => {
        var kernel = new Kernel();
        expect(kernel).toBeTruthy();   
    });
});