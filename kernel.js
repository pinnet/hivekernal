const v8 = require('v8');
const Worker = require('webworker-threads').Worker;
const isNode = require('detect-node');
const Storage = require('dom-storage');
const uuidv1 = require('uuid/v1');
const mqtt = require('async-mqtt');
const indexedDB = require("fake-indexeddb");
const IDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");
var passed = true;

class Kernel {
    get lastQOS(){ 
        var lqos = this.localStorage.getItem('LastQOS');
        if (lqos === null){
            lqos = new Date().getTime();
            this.lastQOS = lqos;
        }
        return parseInt(lqos.toString());
    }
    set lastQOS(value) { 
        this.localStorage.setItem('LastQOS',value);     
    }
    get QOS(){ 
        var qos = this.localStorage.getItem('QOS');
        if (qos === null || qos > 0.9999 || qos < 0){
            qos = 0;
            this.QOS = qos;
        }
        return parseFloat(qos);
    }
    set QOS(value) { 
        var multiplyer = parseInt(new Date().getTime() / Math.pow(10,11));
        this.localStorage.setItem('QOS',Math.round(value * Math.pow(10,multiplyer)) / Math.pow(10,multiplyer));     
    }
     
    constructor(){
        
        this.client;
        this.localStorage = new Storage('./db.json', { strict: false, ws: '  ' });
        this.sessionStorage = new Storage(null, { strict: true });
        this.endpoint = {
            id: this.getID(),
            qos: this.calculateQOS()
        }
        this.uuid = this.getSessionID();      
    }
    commandMessage(endpoint){
      var res  = endpoint.message.split('?');
      var attr = res[1].split('#');
      var hash = attr[1];
        switch (res[0]){
            case 'sync' :
            console.log('syncing',attr[0]);
            break;
        }
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
    async onMessage(topic,message){
        
        var worker = new Worker(function (){
            
            onmessage = function(e) {
                
                res = JSON.parse(e.data);

                var topic = res.topic;
                var message = res.message;
                var myId = res.myId;
                var QOS = res.qos;

                if( message === undefined || message === null || message.length == 0 ){ close(); }
                if( topic === undefined || topic === null || topic.length == 0 ){  close(); }
                if( topic === '/db_log/global_network/' ){
                 
                    try{
                        var endpoint = JSON.parse(message);                   
                    }
                    catch(e){
                        close();
                    }

                    if (endpoint.id === undefined || endpoint.qos === undefined 
                        || typeof(endpoint.qos) != 'number' || endpoint.qos > 1){ close(); }
                    endpoint.type = 'DBlog';
                    this.postMessage(JSON.stringify(endpoint));
                    close();  
                }
                else if(topic === myId)
                {
                    res = message.split(':')
                    var endpoint = {
                        type: 'Incomming',
                        id: res[0],
                        message: res[1]
                    }
                    this.postMessage(JSON.stringify(endpoint));
                    close();
                }
                close();
            }
        });

        worker.onerror = function (e){
            console.log(e.data);
        }
       
        var _this = this;
        worker.onmessage = function(e){
            
           var endpoint = JSON.parse(e.data);
            
            if (endpoint.type === 'Incomming'){
                _this.commandMessage(endpoint);
            }
            
           
            var open = indexedDB.open("hivemind", 1);

            open.onupgradeneeded = function() {
                var db = open.result;
                var store = db.createObjectStore("global_network", {keyPath: "id"});
                var index = store.createIndex("endpoint", ["id", "qos"]);
            };
            open.onsuccess  = function() {
                var db = open.result;
                var tx = db.transaction("global_network", "readwrite");
                var store = tx.objectStore("global_network");
                var index = store.index("endpoint");
                store.put({id: 12345, endpoint: {id: endpoint.id, qos: endpoint.qos}});
            }
            tx.oncomplete = function() {
                db.close();
            };
        }
    

        var workerMessage = {
            topic: topic,
            message: message.toString(),
            myId: this.endpoint.id,
            qos: this.QOS
        }
        await worker.postMessage(JSON.stringify(workerMessage));
        
    }
    async onConnect(){
        try{
            await this.client.subscribe('/db_log/global_network/');
            await this.client.subscribe(this.endpoint.id);
            await this.mqttSend('/db_log/global_network/',JSON.stringify(this.endpoint));
            return true;
        }
        catch(e){
            console.log(e);
            return false;
        } 
    }
    async mqttSend(topic,endpoint){
        await this.client.publish(topic,endpoint);
    }

    calculateQOS(){
        var time = new Date().getTime();
        var deltaTime = parseFloat((Math.round(time - this.lastQOS)) / Math.pow(10,15));
        this.lastQOS = time;
        return this.QOS += deltaTime;
    } 
}
module.exports = {Kernel,passed};
