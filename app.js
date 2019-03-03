import express from 'express';
import bodyParser from 'body-parser';
import user from './routes/user';
import { MongoClient } from 'mongodb';
import { clientApiKeyValidation, isNewSessionRequired, isAuthRequired, generateRandomSessionID, getRedisSessionData } from './common/authUtils';
import redis from 'redis';
import Session from './common/Session';
const CONN_URL = 'mongodb://localhost:27017';
let mongoClient = null;
MongoClient.connect(CONN_URL, { useNewUrlParser: true }, function (err, client) {
    mongoClient = client;
})
let redisClient = null;
redisClient = redis.createClient({
    prefix: 'node-sess:',
    host: 'localhost'
});
let app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use((req, res, next) => {
    req.db = mongoClient.db('test');
    next();
})
app.get('/', (req, res, next) => {
    res.status(200).send({
        status: true,
        response: 'Hello World!'
    });
});
app.use(clientApiKeyValidation);

app.use(async (req, res, next) => {
    var apiUrl = req.originalUrl;
    var httpMethod = req.method;
    if (isNewSessionRequired(httpMethod, apiUrl)) {
        let sessionID = generateRandomSessionID()
        req.session = new Session();
        req.session.sessionID = sessionID;
        req.sessionID = sessionID;
    } else if (isAuthRequired(httpMethod, apiUrl)) {
        let sessionID = req.header('sessiontoken');
        if (sessionID) {
            let redisData = await getRedisSessionData(redisClient, sessionID);
            if (redisData) {
                redisData = JSON.parse(redisData);
                req.session = new Session();
                req.sessionID = sessionID;
                req.session.sessionID = sessionID;
                req.session.userData = redisData;
            } else {
                return res.status(401).send({
                    ok: false,
                    error: {
                        reason: "Invalid Sessiontoken",
                        code: 401
                    }
                });
            }
        } else {
            return res.status(401).send({
                ok: false,
                error: {
                    reason: "Missing Sessiontoken",
                    code: 401
                }
            });
        }
    }
    next();
})
app.use('/user', user);
app.use((req, res, next) => {
    if (!res.data) {
        return res.status(404).send({
            ok: false,
            error: {
                reason: "Invalid Endpoint", code: 404
            }
        });
    }
    if (req.session && req.sessionID) {
        try {
            req.session.save(redisClient);
            res.setHeader('sessiontoken', req.sessionID);
            res.data['sessiontoken'] = req.sessionID;
        } catch (e) {
            console.log('Error ->:', e);
        }
    }
    res.status(res.statusCode || 200)
        .send({ ok: true, response: res.data });
})
app.listen(30006, () => {
    console.log(' ********** : running on 30006');
})
process.on('exit', (code) => {
    mongoClient.close();
    console.log(`About to exit with code: ${code}`);
});
process.on('SIGINT', function () {
    console.log("Caught interrupt signal");
    process.exit();
});
module.exports = app;