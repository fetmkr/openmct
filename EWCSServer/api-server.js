import express from 'express';
import { DB } from './db.js';

export default function ApiServer(ewcsData, ewcsImageData) {
    var router = express.Router();

    router.get('/data/history', async function (req, res) {
        const start = +req.query.start;
        const end = +req.query.end;

        const states = await new DB().find(ewcsData, { 
          "$and": [
            {"timecode": { "$gte": start }},
            {"timecode": { "$lte": end }},
          ]
        });

	var response = states.docs.map(
	  state => ({
	    ...state
	  }));

        res.status(200).json(response).end();
    });

    router.get('/image/history', async function (req, res) {
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

    return router;
}
