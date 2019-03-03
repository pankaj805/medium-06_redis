import { getClientDetails } from '../services/ClientService';
import uuid from 'node-uuid';

const newSessionRoutes = [{ path: '/user/login', method: 'POST' }];
const authRoutes = [{ path: '/user/password', method: 'PUT' }];

export const clientApiKeyValidation = async (req, res, next) => {

    let clientApiKey = req.get('api_key');

    if (!clientApiKey) {
        return res.status(400).send({
            status: false,
            response: "Missing Api Key"
        })
    }

    try {
        let clientDetails = await getClientDetails(req.db, clientApiKey);
        if (clientDetails) {
            next();
        }
    } catch (e) {
        console.log('%%%%%%%% error :', e);
        return res.status(400).send({
            status: false,
            response: "Invalid Api Key"
        })
    }

}

export const isNewSessionRequired = (httpMethod, url) => {

    for (let routeObj of newSessionRoutes) {
        if (routeObj.method === httpMethod && routeObj.path === url) {
            return true;
        }
    }

    return false;
}

export const isAuthRequired = (httpMethod, url) => {
    for (let routeObj of authRoutes) {
        if (routeObj.method === httpMethod && routeObj.path === url) {
            return true;
        }
    }
    return false;
}


export const generateRandomSessionID = () => {
    return uuid.v4();
}

export const getRedisSessionData = (redisClient,sessionId) => {
    return new Promise((resolve, reject) => {
        redisClient.get(sessionId, function (err, data) {
            if (err) {
                reject(err);
            } 
            resolve(data);
        });
    })
}
