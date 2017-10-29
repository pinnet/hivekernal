const isNode = require('detect-node');
const Storage = require('dom-storage');
const uuidv1 = require('uuid/v1');
const mqtt = require('async-mqtt');

var client;
var endpoint;
var UUID;
var ID;

class Kernel {
   

    constructor(){
       
        this.localStorage = new Storage('./db.json', { strict: false, ws: '  ' });
        this.sessionStorage = new Storage(null, { strict: true });
        UUID = this.getSessionID();
        ID = this.getID();
        endpoint = {
            id:  ID,
            qos: this.calculateQOS()
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
            client = await mqtt.connect('mqtt://broker.ue3.eu:8083',{
                username:'chestnut',
                password:'9C48FFB7FC319555C141DE44F726E40341' 
            });
            await client.on('connect', this.onConnect);     
            await client.on('message', this.onMessage);
            
        }
        catch(e){
            console.log(e);
            return false;
        }
        return true;
    }
    async onConnect(){
        
        try{
            await client.subscribe('/db_log/global_network/');
            await client.subscribe(ID);
            await client.publish('/db_log/global_network/',JSON.stringify(endpoint));
            return true;
        }
        catch(e){
            console.log(e);
            return false;
        } 
    }

    onMessage(topic, message){
        if( message === undefined || message === null){ return false; }
        if( topic === undefined || topic === null){ return false; }
        if(topic === '/db_log/global_network/'){
            if(message.includes(ID) ){ return false; }
            console.log( topic + message);
        }
        if(topic ===ID)
        {
            console.log(message.toString())  
        }
        return true;
    }
    
    calculateQOS(){
        return 0.0075;
    }

    
}
module.exports = {Kernel};
