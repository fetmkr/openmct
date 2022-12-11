/**
 * Basic implementation of a history and realtime server.
 */

import Spacecraft from './spacecraft.js';
import RealtimeServer from './realtime-server.js';
import HistoryServer from './history-server.js';
import StaticServer from './static-server.js';
import ImageServer from './image-server.js';

import extractFrame  from 'ffmpeg-extract-frame';

import expressWs from 'express-ws';
import express from 'express';
const app = express();

expressWs(app);

var spacecraft = new Spacecraft();
var realtimeServer = new RealtimeServer(spacecraft);
var historyServer = new HistoryServer(spacecraft);
var imageServer = new ImageServer();
var staticServer = new StaticServer();

app.use('/realtime', realtimeServer);
app.use('/history', historyServer);
app.use('/ewcs.image', imageServer);
app.use('/', staticServer);


var port = process.env.PORT || 8080

app.listen(port, function () {
    console.log('Open MCT hosted at http://localhost:' + port);
    console.log('History hosted at http://localhost:' + port + '/history');
    console.log('Realtime hosted at ws://localhost:' + port + '/realtime');
});

async function f1() {
    let path = './ewcsimage/'+Date.now()+'.jpg';
    try {
        await extractFrame({
                input: 'rtsp://admin:kopriControl2022@192.168.0.110:554/Streaming/Channels/101',
                quality: 31,
                output: path
            });
    }  catch (e) {
        console.log(e);
    }
}


setInterval(f1,100000);
