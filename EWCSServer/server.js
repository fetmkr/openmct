/**
 * Basic implementation of a history and realtime server.
 */

// import EWCS from './ewcs.js';

import {EWCS, updateRN171,getCameraIpAddress,getDataSavePeriod,getImageSavePeriod} from './ewcs.js'

import RealtimeServer from './realtime-server.js';
import HistoryServer from './history-server.js';
import StaticServer from './static-server.js';
import ImageServer from './image-server.js';
import ApiServer from './api-server.js';

// import extractFrame  from 'ffmpeg-extract-frame';

import { DB } from './db.js';

import expressWs from 'express-ws';
import express from 'express';
import { time } from 'cron';
const app = express();

expressWs(app);


const main = async () => {
    const ewcsData = await new DB().create('ewcs-data')
    const ewcsImageData = await new DB().create('ewcs-image')
    var ewcs = new EWCS(ewcsData);

    var realtimeServer = new RealtimeServer(ewcs);
    var historyServer = new HistoryServer(ewcs);
    var apiServer = new ApiServer(ewcsData, ewcsImageData);
    var imageServer = new ImageServer(ewcsImageData);
    var staticServer = new StaticServer();
    
    app.use('/realtime', realtimeServer);
    app.use('/history', historyServer);
    app.use('/image', imageServer);
    app.use('/api', apiServer);
    app.use('/', staticServer);
    
    app.get('/DATAIN', (req, res) => {
        //updateRN171(req.query.sd1, req.query.sd2);
        //console.log(req);
        //res.send('Hello World!')
        //console.log('datain get requested')
        updateRN171(req.query.sd1, req.query.sd2);
    })
    
    var port = process.env.PORT || 8080
    
    app.listen(port, function () {
        console.log('Open MCT hosted at http://localhost:' + port);
        console.log('History hosted at http://localhost:' + port + '/history');
        console.log('Realtime hosted at ws://localhost:' + port + '/realtime');
    });
}

main();

// async function f1() {
//     const now = Date.now()
//     let path = `./ewcsimage/${now}.jpg`;
//     let camerapath = 'rtsp://admin:kopriControl2022@' + getCameraIpAddress() +':554/Streaming/Channels/101';
//     console.log("camera path"+camerapath);
//     // const ewcsImageData = await new DB().create('ewcs-image')
//     // new DB().insertAsync(ewcsImageData, { timestamp: now, value: `${now}.jpg` });
//     try {
//         await extractFrame({
//                 //input: 'rtsp://admin:kopriControl2022@192.168.0.12:554/Streaming/Channels/101',
//                 input: camerapath,
//                 quality: 31,
//                 output: path
//             });
//         const ewcsImageData = await new DB().create('ewcs-image')
//         new DB().insertAsync(ewcsImageData, { timestamp: now, value: `${now}.jpg` });
//         console.log("ewcs image saved at: ", Date(Date.now()));
//     }  catch (e) {
//         console.log(e);
//     }
// }



// function timestampPrint() {
//     console.log(Date(Date.now()));
// }

//setInterval(f1,100000);


// function startImageSaveTimer(){

//     const interval = parseInt(getImageSavePeriod())* 1000;

//     //console.log("image save period: "+ parseInt(getImageSavePeriod()).toString()+" seconds");
//     console.log("ewcs image saving.. ")
//     f1();

//     const a = setTimeout(startImageSaveTimer,interval);
// }

// startImageSaveTimer();
