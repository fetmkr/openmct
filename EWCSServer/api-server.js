import express from 'express';
import { DB } from './db.js';
import { iridiumOn,iridiumOff , setStationName, getStationName, cs125On, cs125Off, CS125HoodHeaterOn, CS125HoodHeaterOff } from './ewcs.js';
import { reboot } from './reboot.js';
import { changeSystemIp, changeCouchDbIp, getPublicIp,getLocalIp} from './ip.js';

export default function ApiServer(ewcsData, ewcsImageData) {
  var router = express.Router();
  
  router.get('/data/history', async function (req, res) {
    const start = +req.query.start;
    const end = +req.query.end;
    
    const states = await new DB().find(ewcsData, { 
      "$and": [
        {"timestamp": { "$gte": start }},
        {"timestamp": { "$lte": end }},
      ]
    });
    
    var response = states.docs.map(
      state => ({
        ...state
      }));
      
      res.status(200).json(response).end();
    });
    
    router.get('/image/history', async function (req, res){ 
      const start = +req.query.start;
      const end = +req.query.end;
      
      //new DB().info(spacecraft.db)
      const states = await new DB().find(ewcsImageData, { 
        "$and": [
          {"timestamp": { "$gte": start }},
          {"timestamp": { "$lte": end }},
        ]
      });
      
      var response = states.docs.map(
        state => ({
          ...state
        }));
        
        res.status(200).json(response).end();
      });

      router.get('/set/cs125', async function (req, res) {
        const onData = req.query.on;

        console.log(onData);
        if (onData === '1') {
          cs125On();

        }
        else if(onData === '0') {
          cs125Off();

        }
        
        const response = { "result": onData }
       
          res.status(200).json(response).end();
      });

      router.get('/set/cs125/heater', async function (req, res) {
        const onData = req.query.on;
        
        console.log(onData);
        if (onData === '1') {
          CS125HoodHeaterOn();

        }
        else if(onData === '0') {
          CS125HoodHeaterOff();

        }
        
        const response = { "result": onData }
       
          res.status(200).json(response).end();
      });


      router.get('/set/iridium', async function (req, res) {
        const onData = req.query.on;
        console.log(onData);
        if (onData === '1') {
          iridiumOn();

        }
        else if(onData === '0') {
          iridiumOff();

        }
        
        const response = { "result": onData }
       
          res.status(200).json(response).end();
      });
      
      router.get('/reboot', function(req, res) {
          const result = reboot();
        return res.json({ result: `request reboot of raspberry pi is ${result}` })
      });

      router.get('/set/ip', function(req, res) {
        const ip = req.query.ip
        const gateway = req.query.gateway
        let result1 = false;
        let result2 = false;
        console.log("asked to set ip address to "+ip);
        console.log("asked to set gateway to "+gateway);
        if (ip && gateway) {
          result1 = changeSystemIp(`${ip}`, `${gateway}`);
          result2 = changeCouchDbIp(`${ip}`);
          if (result1 && result2) reboot();
        }
      return res.json({ result: `new raspberry pi is ${result1}, ${result2}` })
     });
 
     router.get('/get/ip/public', async function(req, res) {
      const ip = await getPublicIp();
        return res.json({ip: `${ip}`});
     });

     router.get('/get/ip/local',  function(req, res) {
      const ip =  getLocalIp();
        return res.json({ip: `${ip}`});
     });

     router.get('/set/station', async function (req, res) {
      const name = req.query.name;
      setStationName(name);
      const response = { "result": name }
     
        res.status(200).json(response).end();
    });

    router.get('/get/station/name', async function (req, res) {
      const stationName = getStationName();
      return res.json({station: `${stationName}`});
    });

      return router;
    }
