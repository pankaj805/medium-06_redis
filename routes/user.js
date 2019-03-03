import {Router} from 'express';
let router = Router();
import { getUserDetails, updateUserPassword } from '../services/UserService';

router.post('/hello', async (req, res, next) => {
    let uname = req.body.username;
    let userDetails = await getUserDetails(req.db, uname)
    res.data = {
        status: true,
        response: userDetails
    };
    next();
});


router.post('/login', async (req, res, next) => {
    let uname = req.body.username;
    let pwd = req.body.password;
    let userDetails = await getUserDetails(req.db, uname);

    if (userDetails) {
        let { password } = userDetails;
        if (pwd === password) {
            res.data = {
                status: true,
                response: userDetails
            };
            req.session.set(userDetails);
        } else {
            res.statusCode = 400;
            res.data = {
                status: false,
                error: 'Invalid Password'
            };
        }
    } else {
        res.statusCode = 400;
        res.data = {
            status: false,
            error: 'Invalid Username'
        };
    }
    next();
});


router.put('/password', async (req, res, next) => {

    try {
        let oldPwd = req.body.old_password;
        let newPwd = req.body.new_password;

        if (!oldPwd && !newPwd) {
            res.statusCode = 400;
            res.data = {
                status: false,
                error: 'Invalid Parameters'
            }
        }

        let uname = req.session.userData.username;
        let userDetails = await getUserDetails(req.db, uname);

        if (oldPwd !== userDetails.password) {
            res.statusCode = 400;
            res.data = {
                status: false,
                error: "Old Password doesn't match"
            }
        } else {
            let updateRes = await updateUserPassword(req.db,uname,newPwd)
            res.data = {
                status: true,
                response:updateRes,
                message: "Password updated successfully"
            }
        }
        next();
    } catch (e) {
        next(e)
    }
})

export default router;