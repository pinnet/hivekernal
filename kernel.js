const v8 = require('v8');
const Worker = require('webworker-threads').Worker;
const isNode = require('detect-node');
const Storage = require('dom-storage');
const uuidv1 = require('uuid/v1');
const mqtt = require('async-mqtt');
const indexedDB = require("fake-indexeddb");
const IDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");


class Kernel {
     constructor(){
        this.isOpenDB = false;
        this.db = indexedDB.open("test", 3);
        this.endpoints = new Array();        
        this.dbWorker = new Worker(function (){
           var i=0;  
            this.onmessage = function(e) {  
                //
                JSON.parse(e.data).every(function(val){
                    //global.indexedDB.open("test");
                    postMessage(`${i++}:` + JSON.stringify(val));
                    return true;
                }); 
            };             
        });
        this.db.onerror = function(e){
            console.log(e.data);
        }
        this.db.onsuccess = function(e){
            console.log('success');
            this.isOpenDB = true;
        }
        this.dbWorker.onmessage = function(e){
            console.log(e.data);
           // this should update endpoint db 
        }.bind(this);

        this.dbWorker.onerror = function (e){
            console.log(e.data);
        }
        this.client;
        
        this.localStorage = new Storage('./db.json', { strict: false, ws: '  ' });
        this.sessionStorage = new Storage(null, { strict: true });
        this.endpoint = {
            id:  this.getID(),
            qos: this.calculateQOS()            
        }
        this.uuid = this.getSessionID()
        
        var _this = this;
        setInterval(function(){                                                             // Periodicly send message array to dbworker
            _this.sendMessageBuffer();
        },1000);

    }
    sendMessageBuffer(){
        if (this.endpoints.length > 0) {
            this.dbWorker.postMessage(JSON.stringify(this.endpoints));
        }
        this.endpoints = new Array();
    }
    getID(){ 
        var id = this.localStorage.getItem('ID');

        if (id === null){
            id = uuidv1();
            this.localStorage.setItem('ID',id);
        }
        return id.toString();
    }
    getSessionID(){
        var uid = this.sessionStorage.getItem('uid');
                if (uid === null){
                    uid = uuidv1();
                    this.sessionStorage.setItem('uid',uid);
                }
        return uid.toString();
    }
    async establishMQTT(){
        try{
            this.client = await mqtt.connect('mqtt://broker.ue3.eu:8083',{
                username:'chestnut',
                password:'9C48FFB7FC319555C141DE44F726E40341' 
            });
            await this.client.on('connect', this.onConnect.bind(this));     
            await this.client.on('message', this.onMessage.bind(this)); 
        }
        catch(e){
            console.log(e);
            return false;
        }
        return true;
    }
    async onConnect(){
        try{
            await this.client.subscribe('/db_log/global_network/');
            await this.client.subscribe(this.endpoint.id);
            await this.dblog(JSON.stringify(this.endpoint));
            return true;
        }
        catch(e){
            console.log(e);
            return false;
        } 
    }
    async dblog(endpoint){
        await this.client.publish('/db_log/global_network/',endpoint);
    }
    onMessage(topic, message){                                                                   // MQTT message validitiy test and marshalling

        if( message === undefined || message === null || message.length == 0 ){ return false; }
        if( topic === undefined || topic === null || topic.length == 0 ){ return false; }
        if( topic === '/db_log/global_network/' ){
            
            if(message.includes(this.endpoint.id) ){ return false; }
            try{
                var endpoint = JSON.parse(message);
            }
            catch(e){
                return false; 
            }
            if (endpoint.id === undefined || endpoint.qos === undefined 
                || typeof(endpoint.qos) != 'number' || endpoint.qos > 1){ return false; }
            
            this.endpoints.push(endpoint);   
            if(this.endpoints.length > 500){                                                     // Push endpoint messages onto array untill buffer is full;
                this.sendMessageBuffer();                                                        // then send endpoint buffer to dbworker
            } 
            return true;  
        }
        else if(topic === this.endpoint.id)
        {
            this.onIncomming(message); 
            return true;  
        }
        return false;
    }
    onIncomming(message){   
        console.log(message.toString());   
    }
    calculateQOS(){
        return 0.0075;
    } 
}
module.exports = {Kernel};
