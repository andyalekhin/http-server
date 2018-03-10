const http = require('http');
const PORT = process.env.PORT || 3000;
const IP = process.env.IP || "0.0.0.0";

const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const messages = [];

const server = http.createServer( (req, res) => {
    let urlData = url.parse(req.url, true);

    if (urlData.pathname === "/" && req.method === "GET") {
        let data = fs.readFileSync(path.join(__dirname, "public/index.html"));
        res.end(data);
    } else if (urlData.pathname === "/favicon.ico" && req.method === "GET") {
        let data = fs.readFileSync(path.join(__dirname, "public/favicon.ico"));
        res.end(data);
    } else if (urlData.pathname === "/bigfile" && req.method === "GET") {
        let stream = fs.createReadStream(path.join(__dirname, "public/images/big.jpg"));
        stream.pipe(res);

        stream.on('data', (chunk) => {
            console.log("Chunk length", chunk.length);
        });

        stream.on('end', () => {
            console.log("Readstream close");
        });
    } else if (urlData.pathname === "/messages" && req.method === "POST") {
        const writeStream = fs.createWriteStream(path.join(__dirname, "text.txt"));
        const chunks = [];

        req.on("data", function (chunk) {
            chunks.push(chunk);
        });

        req.on("end", function () {
            let body = Buffer.concat(chunks);
            body = body.toString();
            if (req.headers['content-type'] === "application/x-www-form-urlencoded") {
                body = querystring.parse(body);
            } else if (req.headers['content-type'] === "application/json") {
                body = JSON.parse(body);
            }

            messages.push(body);

            writeStream.write(JSON.stringify(body));
            writeStream.end();

            res.write(JSON.stringify(body));
            res.end();
        });
    } else if (urlData.pathname === "/messages" && req.method === "GET") {
        let id = urlData.query.id ? parseInt(urlData.query.id) : null;
        if (id && id > 0 && messages[id - 1]) {
            res.write(JSON.stringify(messages[id - 1]));
        } else {
            res.write(JSON.stringify(messages));
        }
        res.end();
    } else {
        let data = fs.readFileSync(path.join(__dirname, "public/404.html"));
        res.end(data);
    }
});

server.listen(PORT,IP, () => {
    console.log("Server starting:", IP, ":", PORT);
});