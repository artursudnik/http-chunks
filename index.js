const express = require('express'),
      moment  = require('moment'),
      morgan  = require('morgan');

const app = express();

app.use(morgan('combined'));

app.use((req, res, next) => {
    req.socket.on('close', hadError => {
        console.log(`socket closed${hadError ? ' with error' : ' with no error'}`);
    });
    next();
});

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
    let counter = 0,
        chunk   = `this is some chunk of data`;

    if (drop) {
        req.socket.setTimeout(1100);
    }

    console.log(`received http request, starting sending chunks in response`);

    res.header('Content-Type', 'text/plain; charset=utf-8');

    if (cacheable) {
        res.header('Cache-Control', 'public, max-age=86400');
    } else {
        res.header('Cache-Control', 'no-store');
    }

    let interval = setInterval(() => {
        console.log(`sending another chunk`);
        res.write(`${chunk} generated at ${moment().format('HH:mm:ss.SSS')}\r\n`);
        counter++;
        if (counter === 20) {
            console.log(`stopping sending chunks`);
            console.log(`waiting 5s to end sending response`);
            setTimeout(() => {
                res.write(`chunk sent just before response end at ${moment().format('HH:mm:ss.SSS')}\r\n`);
                console.log(`finishing response`);
                res.end();
            }, 5000);
            clearInterval(interval);
        }
    }, 100)
}

const server = app.listen(process.env.PORT ? parseInt(process.env.PORT) : 3000, '0.0.0.0');

server.on('listening', () => {
    console.log(`server started: ${server.address().address}:${server.address().port} (${server.address().family})`)
});
