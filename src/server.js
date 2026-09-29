const http = require('http');
const query = require('querystring');

const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request, response, handler) => {
    const body = [];

    request.on('error', (err) => {
        console.dir(err);
        response.statusCode = 400;
        response.end();
    });

    request.on('data', (chunk) => {
        body.push(chunk);
    });

    request.on('end', () => {
        const bodyString = Buffer.concat(body).toString();
        const type = request.headers['content-type'];

        if (type === 'application/x-www-form-urlencoded') {
            request.body = query.parse(bodyString);
        } else if (type === 'application/json') {
            try {
                request.body = JSON.parse(bodyString);
            } catch {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({
                    message: 'Invalid JSON data.',
                    id: 'invalidJSON',
                }));
                return response.end();
            }
        } else {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.write(JSON.stringify({
                message: 'Invalid data format.',
                id: 'invalidFormat',
            }));
            return response.end();
        }

        return handler(request, response);
    });
};

const handlePost = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/addUser') {
        return parseBody(request, response, jsonHandler.addUser);
    }

    return jsonHandler.notFound(request, response);
};

const handleGet = (request, response, parsedUrl) => {
    if (parsedUrl.pathname === '/') {
        return htmlHandler.getIndex(request, response);
    }

    if (parsedUrl.pathname === '/style.css') {
        return htmlHandler.getCSS(request, response);
    }

    if (parsedUrl.pathname === '/getUsers') {
        return jsonHandler.getUsers(request, response);
    }

    return jsonHandler.notFound(request, response);
};

const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';

    const parsedUrl = new URL(
        request.url,
        `${protocol}://${request.headers.host}`,
    );

    if (request.method === 'POST') {
        return handlePost(request, response, parsedUrl);
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
        return handleGet(request, response, parsedUrl);
    }

    return jsonHandler.notFound(request, response);
};

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1: ${port}`);
});
