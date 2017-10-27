var isNode = require('detect-node');
var Storage = require('dom-storage');
const uuidv1 = require('uuid/v1');
var mqtt = require('mqtt');
var client;
var ID;
var QOS;
var UUID;

class Kernel {

    constructor(){
       
        this.localStorage = new Storage('./db.json', { strict: false, ws: '  ' });
        this.sessionStorage = new Storage(null, { strict: true });
        ID = this.getID();
        QOS = this.calculateQOS();
        UUID = this.getSessionID();
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
   
    establishMQTT(){
        try{
            client  = mqtt.connect('wws://broker.ue3.eu/mqtt',{
                
                username:'chestnut',
                password:'9C48FFB7FC319555C141DE44F726E40341' 
            });
            client.options = {
                port:443,
                auth:true,
                clean:true,
                clientId:UUID
            };

            //if (!client.connected){ throw new Error(); }
            client.on('connect', this.onConnect);     
            client.on('message', this.onMessage);
        }
        catch(e){
            console.log(e);
            return false;
        }
        return true;
    }
    onConnect(){
        client.subscribe('/db_log/global_network/');
        client.publish('/db_log/global_network/','{' + ID + '}#'+ QOS ); 
    }

    onMessage(topic,message){
        console.log(topic + message);
         client.end();
      
    }
    
    calculateQOS(){
        return 0.0005.toString();
    }

    
}
module.exports = {Kernel};
