import {Router} from 'express';
let router = Router();
import {getUserDetails} from '../services/UserService';

router.post('/hello',async (req,res)=>{
    let uname = req.body.username;
    let userDetails = await getUserDetails(req.db,uname)
    res.status(200).send({
        status:true,
        response:userDetails
    });
});

export default router;