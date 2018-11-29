const express = require('express');

const app = express();

app.get('/', (req, res) => {
    let counter = 0,
        chunk   = `this is some chunk of data`;

    req.socket.setTimeout(1100);

    console.log(`received http request, starting sending chunks in response`);

    let interval = setInterval(() => {
        console.log(`sending another chunk`);
        res.write(`${chunk} generated at ${new Date()}\n`);
        counter++;
        if (counter === 2) {
            console.log(`stopping sending chunks`);
            console.log(`keeping connection opened for a while`);
            setTimeout(() => {
                // console.log(`closing socket`);
                // res.socket.destroy();

                console.log(`finishing response`);
                res.end();
            }, 5000);
            clearInterval(interval);
            // res.end();
        }
    }, 1000)
});

app.listen(3000);