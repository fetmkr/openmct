import express  from 'express';
const app = express()
const port = 8080

// const { SerialPort } = require('serialport')
import { SerialPort, ReadlineParser  } from 'serialport';

// const adc = require('mcp-spi-adc')
import adc from 'mcp-spi-adc';

// const Gpio = require('onoff').Gpio
import { Gpio } from 'onoff';
const LED = new Gpio(16, 'out')

// const isOnline = require('is-online')
import isOnline from 'is-online';


// import ffmpeg from 'ffmpeg';



import fs from  'fs';



app.get('/DATAIN', (req, res) => {
  //res.send('Hello World!')
  //console.log('datain get requested')
  console.log('Temp: ' + req.query.sd1)
  console.log('Humidity: ' + req.query.sd2)
})

app.get('/', (req, res) => {
    res.send('Hello World!')
    
  })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })


// 시리얼 포트 리스팅 하기
SerialPort.list().then(ports => {
    console.log("OK");
    console.log(ports);
},
err => {
console.log(err);
});


// dsPic port
const port0 = new SerialPort({
    path: '/dev/ttyAMA0',
    baudRate: 115200,
})

// cs125 port
const port2 = new SerialPort({
    path: '/dev/ttyAMA1',
    baudRate: 38400,
})

const parser2 = new ReadlineParser({ delimiter: '\r\n' });
port2.pipe(parser2);
parser2.on('data', (line) => {
    console.log(line);
    //port2.write(sendBuffer);
    
});


import crc16ccitt from 'crc/crc16ccitt';
let getBuffer = Buffer.from([0x02]);
getBuffer = Buffer.concat([getBuffer,Buffer.from('GET:0:0')]);
let crc = crc16ccitt(getBuffer).toString(16);
getBuffer = Buffer.concat([getBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(getBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]);

//console.log(sendBuffer);



// turn off hood heater
let hoodOffBuffer = Buffer.concat([Buffer.from([0x02]),Buffer.from('SET:0:0 0 0 10000 0 0 1000 2 3442 M 1 0 5 0 1 1 0 1 1 0 7.0 80')]);
let hoodOnBuffer = Buffer.concat([Buffer.from([0x02]),Buffer.from('SET:0:0 0 0 10000 0 0 1000 2 3442 M 1 0 5 0 1 1 0 0 1 0 7.0 80')]);

hoodOnBuffer = Buffer.concat([hoodOnBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(hoodOnBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]);
hoodOffBuffer = Buffer.concat([hoodOffBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(hoodOffBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]);


port2.write(getBuffer);


// iridium port
const port3 = new SerialPort({
    path: '/dev/ttyAMA2',
    baudRate: 9600,
})



// BMS port
const port5 = new SerialPort({
    path: '/dev/ttyAMA3',
    baudRate: 9600,
})

const cs125Current = adc.open(0, {speedHz: 20000}, err => {
    if (err) throw err;
});

const iridiumCurrent = adc.open(1, {speedHz: 20000}, err => {
    if (err) throw err;
});

const poeCurrent = adc.open(2, {speedHz: 20000}, err => {
    if (err) throw err;
});

const inputVoltage = adc.open(3, {speedHz: 20000}, err => {
    if (err) throw err;
});


function sendHeartbeat() {
    port0.write('R');
    // port2.write('CS125\n');
    // port3.write('Iridium\n');
    // port5.write('BMS\n');
    //console.log("Hearbeat Sent: " + Date.now());
}

function checkNetworkConnection() {
    isOnline().then(online => {
        if(online){
            LED.writeSync(1);
            console.log("Connected to internet");
            console.log(' ');
        }else{
            LED.writeSync(0);
            console.log("Not connected to internet");
            console.log(' ');
        }
       });
}

export function readADC() {
    cs125Current.read((err, reading) => {
        if (err) throw err;
        console.log('cs125 Current: '+ parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3) + ' A');
    });
    iridiumCurrent.read((err, reading) => {
        if (err) throw err;
        console.log('iridium Current: '+ parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3) + ' A');
    });
    poeCurrent.read((err, reading) => {
        if (err) throw err;
        console.log('poe Current: '+ parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3) + ' A');

    });
    inputVoltage.read((err, reading) => {
        if (err) throw err;
  
        console.log('Input Voltage: ' + parseFloat((reading.rawValue * 3.3 / 1024) * 46 / 10).toFixed(3)+' V');
        // console.log(reading.rawValue);
      });
    
    console.log('RPI CPU Temp: ' + readTemp() + ' C');  
    console.log(' ');

    return readTemp();
}

function readTemp() {
    let temp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
    let temp_c = temp/1000;
    return temp_c;
}



//f1();

// 주기적으로 실행하기
setInterval(sendHeartbeat, 1000);

//setInterval(readADC, 1000);

setInterval(checkNetworkConnection, 5000);




