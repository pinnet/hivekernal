const isNode = require('detect-node');
const Storage = require('dom-storage');
const uuidv1 = require('uuid/v1');
const mqtt = require('async-mqtt');
const indexedDB = require("fake-indexeddb");
const IDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");


class Kernel {

     constructor(){

        this.client;
        this.db = indexedDB.open("test", 3);
        this.localStorage = new Storage('./db.json', { strict: false, ws: '  ' });
        this.sessionStorage = new Storage(null, { strict: true });
        this.endpoint = {
            id:  this.getID(),
            qos: this.calculateQOS()            
        }
        this.uuid = this.getSessionID()
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
            await this.client.publish('/db_log/global_network/',JSON.stringify(this.endpoint));
            return true;
        }
        catch(e){
            console.log(e);
            return false;
        } 
    }
    
    onMessage(topic, message){

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
            this.updateDB(endpoint);
        }
        if(topic === this.endpoint.id)
        {
            this.onIncomming(message);   
        }
        return true;
    }
    updateDB(endpoint){
        
        console.log(endpoint); 
        
        
    }
    onIncomming(message){
        
                console.log(message.toString()); 
        
        
    }
    calculateQOS(){
        return 0.0075;
    }

    
}
module.exports = {Kernel};
