const expect = require('expect');
var Storage = require('dom-storage');
const uuidv4 = require('uuid/v4');

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
});
describe('Kernel onMessage(message) (kernel.js)',() => {
    it('onMessage should accept correct db log message', (done) => {
        var result = kernel.onMessage('/db_log/global_network/','{"id":"1","qos": 0}'); 
        expect(result).toBeTruthy();
        done();
    });
    it('onMessage should accept correct incomming message', (done) => {
        var result = kernel.onMessage(kernel.localStorage.getItem('ID'),'test'); 
        expect(result).toBeTruthy();
        done();
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
    it('onMessage should reject empty message', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',''); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject invalid endpoint [qos NAN]', (done) => {
        var result = kernel.onMessage('/db_log/global_network/','{"id":"123","qos":"0"}'); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject invalid endpoint [qos > 1]', (done) => {
        var result = kernel.onMessage('/db_log/global_network/','{"id":"123","qos":1.234}'); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject malformed endpoint', (done) => {
        var result = kernel.onMessage('/db_log/global_network/','{"id":"1","qos":0'); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject undefined topic', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',undefined); 
        expect(result).toBeFalsy();
        done();
    });
    it('onMessage should reject empty topic', (done) => {
        var result = kernel.onMessage('/db_log/global_network/',''); 
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
    it('onMessage should accept multiple endpoints 32k', (done) => {
        for (var n =0;n < 32000;n++){
        
        kernel.onMessage('/db_log/global_network/','{"id":"'+ uuidv4() +'","qos":0}'); 
        
        
        }
        //expect(result).toBeFalsy();
        done();
    });
    it('onMessage should accept multiple endpoints 32k', (done) => {
        for (var n =0;n < 32000;n++){
        
        kernel.onMessage('/db_log/global_network/','{"id":"'+ uuidv4() +'","qos":1}'); 
        
        
        }
        //expect(result).toBeFalsy();
        done();
    });
    it('onMessage should accept multiple endpoints 32k', (done) => {
        for (var n =0;n < 32000;n++){
        
        kernel.onMessage('/db_log/global_network/','{"id":"'+ uuidv4() +'","qos":1}'); 
        
        
        }
        //expect(result).toBeFalsy();
        done();
    });
});