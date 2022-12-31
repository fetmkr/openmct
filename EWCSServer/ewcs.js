import { DB } from './db.js';
import { SerialPort, ReadlineParser  } from 'serialport';
import adc from 'mcp-spi-adc';
import { Gpio } from 'onoff';
const LED = new Gpio(16, 'out')
import isOnline from 'is-online';
import crc16ccitt from 'crc/crc16ccitt';
import fs from  'fs';
import CronJob from 'cron';

const job = new CronJob.CronJob(
	'0 0 * * * ',
	function() {
        sendIridium();
		console.log('You will see this message every 24 hour');
	},
	null,
	true,
	'Asia/Seoul'
);

let ewcsData = {
    stationName: "KOPRI",
    timestamp: 0,
    cs125Current : 0,
    cs125Visibility: 0,
    cs125SYNOP: 0,
    cs125Temp: 0,
    cs125Humidity: 0,
    rn171Temp: 0,
    rn171Humidity: 0,
    iridiumCurrent : 0,
    poeCurrent : 0,
    rpiTemp: 0,
    batteryVoltage : 0,
    mode: "normal"
};

function setEWCSTime(){
    ewcsData.timestamp = Date.now();
}

function updateRN171(temp, humidity){
    ewcsData.rn171Temp = temp;
    ewcsData.rn171Humidity = humidity;
    //console.log('RN171 Temp: ' + temp);
    //console.log('RN171 Humidity: ' + humidity);
}

// 시리얼 포트 리스팅 하기
// SerialPort.list().then(ports => {
//     console.log("OK");
//     console.log(ports);
// },
// err => {
// console.log(err);
// });


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
    //console.log(line);
    const data = line.split(" ");
    // data[0] 이 2 바이트라 접근을 다음과 같이 했다 data[0][0] = 0x02, data[0][1] = 5 (full SYNOP)
    if(parseInt(data[0][1]) == 5)
    {
        //console.log('CS125 full SYNOP message');
        ewcsData.cs125Visibility = parseInt(data[4]);
        ewcsData.cs125SYNOP = parseInt(data[23]);
        ewcsData.cs125Temp = parseFloat(data[24]); 
        ewcsData.cs125Humidity = parseFloat(data[25]); 
    }
});


function CS125HoodHeaterOn()
{
    let hoodOnBuffer = Buffer.concat([Buffer.from([0x02]),Buffer.from('SET:0:0 0 0 10000 0 0 1000 2 3442 M 1 0 5 0 1 1 0 0 1 0 7.0 80')]);
    hoodOnBuffer = Buffer.concat([hoodOnBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(hoodOnBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]); 
    port2.write(hoodOnBuffer);
}

function CS125HoodHeaterOff()
{
    let hoodOffBuffer = Buffer.concat([Buffer.from([0x02]),Buffer.from('SET:0:0 0 0 10000 0 0 1000 2 3442 M 1 0 5 0 1 1 0 1 1 0 7.0 80')]);
    hoodOffBuffer = Buffer.concat([hoodOffBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(hoodOffBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]);
    port2.write(hoodOffBuffer);
}

function CS125GetStatus()
{
    let getBuffer = Buffer.from([0x02]);
    getBuffer = Buffer.concat([getBuffer,Buffer.from('GET:0:0')]);
    getBuffer = Buffer.concat([getBuffer,Buffer.from(':'),Buffer.from(crc16ccitt(getBuffer).toString(16)),Buffer.from(':'),Buffer.from([0x03,0x0D,0x0A])]);
    port2.write(getBuffer);
}

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

const cs125CurrentADCChan = adc.open(0, {speedHz: 20000}, err => {
    if (err) throw err;
});

const iridiumCurrentADCChan = adc.open(1, {speedHz: 20000}, err => {
    if (err) throw err;
});

const poeCurrentADCChan = adc.open(2, {speedHz: 20000}, err => {
    if (err) throw err;
});

const batteryVoltageADCChan = adc.open(3, {speedHz: 20000}, err => {
    if (err) throw err;
});


function sendHeartbeat() {
    port0.write('R');
    //console.log("Hearbeat Sent: " + Date.now());
}

function checkNetworkConnection() {
    isOnline().then(online => {
        if(online){
            LED.writeSync(1);
            //console.log("Connected to internet");
        }else{
            LED.writeSync(0);
            console.log("Not connected to internet");
        }
       });
}

function readADC() {
    cs125CurrentADCChan.read((err, reading) => {
        if (err) throw err;
        ewcsData.cs125Current = parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3);
        //console.log('cs125 Current: '+ ewcsData.cs125Current + ' A');
    });
    iridiumCurrentADCChan.read((err, reading) => {
        if (err) throw err;
        ewcsData.iridiumCurrent = parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3);
        //console.log('iridium Current: '+ ewcsData.iridiumCurrent + ' A');
    });
    poeCurrentADCChan.read((err, reading) => {
        if (err) throw err;
        ewcsData.poeCurrent = parseFloat((reading.rawValue * 3.3 / 1024)*20000/1000).toFixed(3);
        //console.log('poe Current: '+ ewcsData.poeCurrent + ' A');

    });
    batteryVoltageADCChan.read((err, reading) => {
        if (err) throw err;
        ewcsData.batteryVoltage = parseFloat((reading.rawValue * 3.3 / 1024) * 46 / 10).toFixed(3);
        //console.log('Input Voltage: ' + ewcsData.batteryVoltage +' V');
        // console.log(reading.rawValue);
    });
    
    ewcsData.rpiTemp = readTemp();

    //console.log('RPI CPU Temp: ' + ewcsData.rpiTemp + ' C');  
    //console.log(' ');

    return ewcsData;
}   

function readTemp() {
    let temp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
    let temp_c = temp/1000;
    return temp_c;
}

function ewcsLog() {
    console.log(ewcsData);
}

let iridiumResponse;
let iridiumState = 0; // 0: standby, 1: data sent, 2: 0x06 ack received, 3: 0x06 -> 0x08 success received, 4: 0x06 -> 0x08 -> 0x0a end received
let sendCnt = 0;
let intervalID=0;

port3.on('data', function(data){
    iridiumResponse = data;
    if (iridiumResponse.length == 1) {


        console.log("iridium response 1 byte: " + iridiumResponse[0].toString(16));

        switch (iridiumResponse[0]){
            case 0x06:
                if(iridiumState == 1) {
                    iridiumState =2;
                    console.log("ack received");
                }
                break;
            case 0x08:
                if(iridiumState == 2) {
                    iridiumState = 3;
                    console.log("ack + success received");
                }
                break;
            case 0x0a:
                if(iridiumState == 3) {

                    console.log("ack + success + end received");
                    console.log("iridium data sent successfully.");
                    clearInterval(intervalID);
                    sendCnt = 0;
                    iridiumState = 0;
                }
                break;
            default:
                break;
        }



        // if(iridiumResponse[0] == 0x0a && sendCnt >= 1){
        //     sendCnt = 0;
        //     console.log("iridium data sent successfully.");
        //     clearInterval(intervalID);
        // }

    }
    else{
        console.log("iridium response: " + iridiumResponse);
    }

});

function sendIridium(){
    // construct data
    // send data
    // wait for ack: 0x06
    // wait for success: 0x08
    // wait for end: 0x0A

    let utcBuffer = Buffer.allocUnsafe(8);
    utcBuffer.writeBigInt64BE(BigInt(Date.now()));
    //console.log("utc bytes to number: " + Number(utcBuffer.readBigInt64BE(0))); 

    let cs125CurrentBuffer = Buffer.allocUnsafe(4);
    cs125CurrentBuffer.writeFloatBE(Number(ewcsData.cs125Current));

    let cs125VisibilityBuffer = Buffer.allocUnsafe(4);
    cs125VisibilityBuffer.writeInt32BE(Number(ewcsData.cs125Visibility));

    let cs125SYNOPBuffer = Buffer.allocUnsafe(4);
    cs125SYNOPBuffer.writeInt32BE(Number(ewcsData.cs125SYNOP));

    let cs125TempBuffer = Buffer.allocUnsafe(4);
    cs125TempBuffer.writeFloatBE(Number(ewcsData.cs125Temp));

    let cs125HumidityBuffer = Buffer.allocUnsafe(4);
    cs125HumidityBuffer.writeFloatBE(Number(ewcsData.cs125Humidity));

    let rn171TempBuffer = Buffer.allocUnsafe(4);
    rn171TempBuffer.writeFloatBE(Number(ewcsData.rn171Temp));

    let rn171HumidityBuffer = Buffer.allocUnsafe(4);
    rn171HumidityBuffer.writeFloatBE(Number(ewcsData.rn171Humidity));

    let iridiumCurrentBuffer = Buffer.allocUnsafe(4);
    iridiumCurrentBuffer.writeFloatBE(Number(ewcsData.iridiumCurrent));

    let poeCurrentBuffer = Buffer.allocUnsafe(4);
    poeCurrentBuffer.writeFloatBE(Number(ewcsData.poeCurrent));

    let rpiTempBuffer = Buffer.allocUnsafe(4);
    rpiTempBuffer.writeFloatBE(Number(ewcsData.rpiTemp));

    let batteryVoltageBuffer = Buffer.allocUnsafe(4);
    batteryVoltageBuffer.writeFloatBE(Number(ewcsData.batteryVoltage));

    let modeBuffer = Buffer.allocUnsafe(4);
    let modeVal = 0;
    if(ewcsData.mode === "normal") {
        modeVal = 0;
        //console.log("normal")
    }
    else {
        modeVal= 1;
        //console.log("emergency")
    }
    modeBuffer.writeInt32BE(modeVal);

    let iridiumData = Buffer.concat([
    Buffer.from(ewcsData.stationName),
    Buffer.from(':'),
    utcBuffer,
    cs125CurrentBuffer,
    cs125VisibilityBuffer,
    cs125SYNOPBuffer,
    cs125TempBuffer,
    cs125HumidityBuffer,
    rn171TempBuffer,
    rn171HumidityBuffer,
    iridiumCurrentBuffer,
    poeCurrentBuffer,
    rpiTempBuffer,
    batteryVoltageBuffer,
    modeBuffer
    ]);



    let sumc = 0;

    sumc = iridiumData.reduce((accumulator, value) => {
        return accumulator + value;
    },0);

    //console.log("sumc "+sumc);



    let dataLen = iridiumData.length;
    let dataLenBuffer = Buffer.allocUnsafe(1);
    dataLenBuffer.writeUInt8(dataLen);
    console.log("data length: "+dataLen);
    console.log("data length buffer: "+ dataLenBuffer[0].toString(16));




    // let iridiumCRC = crc16ccitt(iridiumData);
    let iridiumCRCBuffer = Buffer.allocUnsafe(2);
    iridiumCRCBuffer[0] = sumc / 256;
    iridiumCRCBuffer[1] = sumc % 256;


    // iridiumCRCBuffer.writeUInt16BE(iridiumCRC);

    iridiumData = Buffer.concat([Buffer.from([0xff,0xff,0xff]), dataLenBuffer,iridiumCRCBuffer,iridiumData]);
    console.log(iridiumData);
    console.log(iridiumData.length);

    // check if iridium edge pro is ready to send the data
    // Is booted? 
    // $$BOOT12345
    // Is Gps ready
    // $$TIME....
    // Is finshed?
    // 0x0A?


    sendCnt = 0;
    iridiumState = 0;

    port3.write(iridiumData);
    sendCnt++;
    iridiumState = 1;
    console.log("Iridium data send requested: " + sendCnt + " th times");

    intervalID = setInterval(function(){
        iridiumState = 0;

        // if(iridiumResponse && iridiumResponse.length == 1 && iridiumResponse[0] == 0x0a && iridiumState == 1){
        //     sendCnt = 0;
        //     iridiumState = 0;
        //     console.log("iridium data sent successfully.");
        //     clearInterval(intervalID);
        //     return;
        // }

        port3.write(iridiumData);
        iridiumState = 1;
        sendCnt++;

        console.log("Iridium data send requested: " + sendCnt + " th times");

        if(sendCnt > 10) {
            iridiumState = 0;
            clearInterval(intervalID);
            console.log("failed to send iridium data!");
        }
    }, 5*60*1000);

}

function iridiumOn(){
    port0.write('I');
    console.log('iridium on')

}

function iridiumOff(){
    port0.write('i');
    console.log('iridium off')

}

function cs125On(){
    port0.write('C');
    console.log('cs125 on')

}

function cs125Off(){
    port0.write('c');
    console.log('cs125 off')

}

function poeOn(){
    port0.write('P');
    console.log('poe on')

}

function poeOff(){
    port0.write('p');
    console.log('poe off')

}



function EWCS(db) {
    this.state = {
        "ewcs.cs125.current": 0,
        "ewcs.cs125.visibility": 0,
        "ewcs.cs125.SYNOP": 0,
        "ewcs.cs125.temp": 0,
        "ewcs.cs125.humidity": 0,
        "ewcs.rn171.temp": 0,
        "ewcs.rn171.humidity": 0,
        "ewcs.iridium.current": 0,
        "ewcs.poe.current": 0,
        "ewcs.rpi.temp": 0,
        "ewcs.battery.voltage": 0,
        "ewcs.mode": "normal",

    };
    this.db = db;
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    setInterval(function () {
        this.updateState();
        this.generateTelemetry();
        ewcsLog();
    }.bind(this), 1000);

    setInterval(function () {
        new DB().insertAsync(db, { ... ewcsData });
    }.bind(this), 60*1000);
 
};

EWCS.prototype.updateState = function () {
    readADC();
    this.state["ewcs.cs125.current"] = ewcsData.cs125Current;
    this.state["ewcs.cs125.visibility"] = ewcsData.cs125Visibility;
    this.state["ewcs.cs125.SYNOP"] = ewcsData.cs125SYNOP;
    this.state["ewcs.cs125.temp"] = ewcsData.cs125Temp;
    this.state["ewcs.cs125.humidity"] = ewcsData.cs125Humidity;
    this.state["ewcs.rn171.temp"] = ewcsData.rn171Temp;
    this.state["ewcs.rn171.humidity"] = ewcsData.rn171Humidity;
    this.state["ewcs.iridium.current"] = ewcsData.iridiumCurrent;
    this.state["ewcs.poe.current"] = ewcsData.poeCurrent;
    this.state["ewcs.rpi.temp"] = ewcsData.rpiTemp;
    this.state["ewcs.battery.voltage"] = ewcsData.batteryVoltage;
    this.state["ewcs.mode"] = ewcsData.mode;  
    
    setEWCSTime();
};

EWCS.prototype.generateTelemetry = function () {
    var timestamp = Date.now(), sent = 0;
    Object.keys(this.state).forEach(function (id) {
        var state = { timestamp: timestamp, value: this.state[id], id: id};
        this.notify(state);
        this.history[id].push(state);
    }, this);
};

EWCS.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

EWCS.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

//sendIridium();

// 주기적으로 실행하기
setInterval(sendHeartbeat, 1000);
setInterval(checkNetworkConnection, 5000);

export {EWCS, readADC, updateRN171, setEWCSTime, ewcsLog, iridiumOn, iridiumOff, sendIridium};
