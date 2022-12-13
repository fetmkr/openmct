import express from 'express';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
import fs from 'fs'
import glob from 'glob'

export default function ImageServer() {
    var router = express.Router();

    router.use('/', express.static(__dirname + './'));
 
    router.get('/last/:size', function (req, res) {
        var size = req.params.size

        const newestFiles = glob.sync('./ewcsimage/*.jpg')
                .map(name => ({name, ctime: fs.statSync(name).ctime}))
                .sort((a, b) => a.ctime - b.ctime).slice(-16)
        console.log(newestFiles)
        var response = newestFiles.map(f => 'http://192.168.0.239:8080/ewcs.image/'+f.name)
        res.status(200).json(response).end();
    });

    return router;
}
