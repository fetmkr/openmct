import express from 'express';
const app = express();

import { spawn, spawnSync } from 'child_process';
import { reboot } from './reboot.js';
import { changeSystemIp, changeWebClientIp, getPublicIp } from './ip.js';

app.get('/reboot', function(req, res) {
    const result = reboot();
	return res.json({ result: `request reboot of raspberry pi is ${result}` })
});

app.get('/set/ip', function(req, res) {
    const ip = req.query.ip
    const gateway = req.query.gateway
    let result = false
    if (ip && gateway) {
      result = changeSystemIp(`${ip}`, `${gateway}`)
      result = changeWebClientIp(`${ip}`, `${gateway}`)
    }
	return res.json({ result: `new raspberry pi is ${result}` })
});

POST

/set/cs125/heater?on=1
/set/poe?on=1
/set/iridium?on=1
/set/mode?normal emergency

app.get('/get/ip', async function(req, res) {
    const ip = await getPublicIp();
	return res.json({ ip: `${ip}` })
});

/get/cs125/heater
/get/cs125/mode
/get/cs125/log


app.listen(8080, function () {
	console.log('Open MCT hosted at http://localhost:' + 8080);
});
