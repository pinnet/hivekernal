const expect = require('expect');
var Storage = require('dom-storage');

const {Kernel} = require('./kernel');

describe('Kernel (kernel.js)',() => {
    it('should create a new instance', () => {
        var kernel = new Kernel();
        expect(kernel).toBeTruthy();   
    });

    it('getID() should establish persistant id', () => {
        var kernel = new Kernel();
        expect(kernel).toBeTruthy();
        expect(kernel.getID()).toBe(kernel.localStorage.getItem('ID')); 
    });
    it('establishMQTT() should setup secure mqtt and register callbacks', (done) => {
        var kernel = new Kernel();
        expect(kernel).toBeTruthy();
        expect(kernel.establishMQTT()).toBeTruthy();
        done();
    });







});