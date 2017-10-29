const expect = require('expect');
var Storage = require('dom-storage');

const {Kernel} = require('./kernel');
 var kernel = new Kernel();
describe('Kernel required before connection (kernel.js)',() => {
    it('should create a new instance', () => {
       
        expect(kernel).toBeTruthy();   
    });

    it('getID() should establish persistant id', () => {
        expect(kernel.getID()).toBe(kernel.localStorage.getItem('ID')); 
    });
    it('getSessionID() should establish session id', () => {
        expect(kernel.getSessionID()).toBe(kernel.sessionStorage.getItem('uid')); 
    });
});
describe('Kernel Mqtt connection (kernel.js)',() => {
    it('establishMQTT() should setup secure mqtt and register callbacks', (done) => {
      
        expect(kernel.establishMQTT().then((res) => {
        if(!res){ throw new Error();}  
        done();     
        }).catch((e) => {
            console.log(e);
            done();
        })).toBeTruthy();

    });
    it('onMessage should reject undefined message', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',undefined); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject null message', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',null); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject undefined topic', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',undefined); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject null topic', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',null); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject own id on topic /db_log/global_network/', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',kernel.getID()); 
        expect(result).toBeFalsy();
        done();
    });
});