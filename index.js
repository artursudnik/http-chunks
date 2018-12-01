const express = require('express'),
      morgan  = require('morgan');

const app = express();

app.use(morgan('combined'));

app.get('/', (req, res) => {
    res.header('Cache-Control', 'no-store');
    res.header('Content-Type', 'text/html');
    res.send(`
        <a href="/dropBeforeEndCacheable">broken cacheable</a></br>
        <a href="/correctChunksCacheable">correct cacheable</a></br>
        <a href="/dropBeforeEndNonCacheable">broken non-cacheable</a></br>
        <a href="/correctChunksNonCacheable">correct non-cacheable</a>
    `)
});

app.get('/dropBeforeEndCacheable', (req, res) => {
    handler(true, true, req, res)
});

app.get('/correctChunksCacheable', (req, res) => {
    handler(false, true, req, res)
});

app.get('/dropBeforeEndNonCacheable', (req, res) => {
    handler(true, false, req, res)
});

app.get('/correctChunksNonCacheable', (req, res) => {
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
    }

    let interval = setInterval(() => {
        console.log(`sending another chunk`);
        res.write(`${chunk} generated at ${new Date()}\n`);
        counter++;
        if (counter === 2) {
            console.log(`stopping sending chunks`);
            console.log(`waiting 5s to end sending response`);
            setTimeout(() => {
                res.write(`chunk sent just before response end at ${new Date()}`);
                console.log(`finishing response`);
                res.end();
            }, 5000);
            clearInterval(interval);
        }
    }, 1000)
}

const server = app.listen(3000, '0.0.0.0');

server.on('listening', () => {
    console.log(`server started: ${server.address().address}:${server.address().port} (${server.address().family})`)
})