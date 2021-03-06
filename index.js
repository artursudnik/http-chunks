const express = require('express'),
      moment  = require('moment'),
      morgan  = require('morgan'),
      numeral = require('numeral');

const lastChunkDelay           = 8000,
      numberOfChunksNotDelayed = 20,
      chunksInterval           = 100;

console.log(`starting`);
console.log(`last chunk delay set to ${lastChunkDelay/1000}s`);

const app = express();

app.use(morgan('combined'));

app.get('/', (req, res) => {
    res.header('Cache-Control', 'no-store');
    res.header('Content-Type', 'text/html');

    const pageHTML = `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Chunked transfer encoding test cases</title>
            </head>
            <body>
                <a href="/cacheable/incomplete">cacheable incomplete</a></br>
                <a href="/cacheable/complete">cacheable complete</a></br>
                <a href="/noncacheable/incomplete">non-cacheable incomplete</a></br>
                <a href="/noncacheable/complete">non-cacheable complete</a></br>
            </body>
        </html>`;

    res.send(pageHTML);
});

app.get('/cacheable/incomplete', (req, res) => {
    handler(true, true, req, res)
});

app.get('/cacheable/complete', (req, res) => {
    handler(false, true, req, res)
});

app.get('/noncacheable/incomplete', (req, res) => {
    handler(true, false, req, res)
});

app.get('/noncacheable/complete', (req, res) => {
    handler(false, false, req, res)
});

function handler(drop, cacheable, req, res, next) {
    let counter = 0;

    if (drop) {
        req.socket.setTimeout(1100, () => {
            console.log(`${moment().format('HH:mm:ss.SSS')} res.end() called after connection from ${req.socket.remoteAddress}:${req.socket.remotePort} has been closed`);
            res.end();
        });
    }

    const requestType = `${drop ? 'incomplete' : 'complete'} chunks, ${cacheable ? 'cacheable' : 'non-cacheable'}`;

    console.log(`${moment().format('HH:mm:ss.SSS')} received http request (${req.originalUrl}) (${requestType}), starting sending chunks in response`);

    res.header('Content-Type', 'text/plain; charset=utf-8');

    if (cacheable) {
        res.header('Cache-Control', 'public, max-age=60');
    } else {
        res.header('Cache-Control', 'no-store');
    }

    console.log(`${moment().format('HH:mm:ss.SSS')} starting sending ${numberOfChunksNotDelayed} chunks in ${chunksInterval}ms interval`);

    let interval = setInterval(() => {
        let chunk   = `this is ${counter < 9 ?  ' ' : ''}${numeral(counter + 1).format('0o')} chunk of data`;
        console.log(`${moment().format('HH:mm:ss.SSS')} sending ${counter < 9 ?  ' ' : ''}${numeral(counter + 1).format('0o')} chunk to ${req.socket.remoteAddress}:${req.socket.remotePort}`);
        res.write(`${chunk} sent at ${moment().format('HH:mm:ss.SSS')}\r\n`);
        counter++;
        if (counter === numberOfChunksNotDelayed) {
            console.log(`${moment().format('HH:mm:ss.SSS')} stopping sending chunks to ${req.socket.remoteAddress}:${req.socket.remotePort}`);

            if(!drop) {
                console.log(`${moment().format('HH:mm:ss.SSS')} waiting ${lastChunkDelay/1000}s until sending last chunk to ${req.socket.remoteAddress}:${req.socket.remotePort}`);
                setTimeout(() => {
                    console.log(`${moment().format('HH:mm:ss.SSS')} sending last chunk to ${req.socket.remoteAddress}:${req.socket.remotePort}`);
                    res.write(`--------this is LAST CHUNK sent at ${moment().format('HH:mm:ss.SSS')}\r\n`);
                    console.log(`${moment().format('HH:mm:ss.SSS')} ending response with res.end() (zero byte chunk is being sent to ${req.socket.remoteAddress}:${req.socket.remotePort})`);
                    res.end();
                }, lastChunkDelay);
            }

            clearInterval(interval);
        }
    }, chunksInterval)
}

const server = app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, '0.0.0.0');

server.on('listening', () => {
    console.log(`${moment().format('HH:mm:ss.SSS')} server started: ${server.address().address}:${server.address().port} (${server.address().family})`)
});

server.on('connection', (socket) => {
    console.log(`${moment().format('HH:mm:ss.SSS')} new connection from ${socket.remoteAddress}:${socket.remotePort}`);
    socket.on('close', hadError => {
        console.log(`${moment().format('HH:mm:ss.SSS')} connection from ${socket.remoteAddress}:${socket.remotePort} closed${hadError ? ' with error' : ' with no error'}`);
    });

    socket.setTimeout(0);

});


server.timeout = 0;
server.keepAliveTimeout = 0;