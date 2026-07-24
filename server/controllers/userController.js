const {query} = require("../config/db");

const getusers = async(req , res)=>{
    try{
        const result = await query('SELECT * FROM users ORDER BY id');
        res.status(200).json({
            success: true,
            users : result.rows
        });
        console.log(result.rows);
    }
    catch(error){
        console.log(error);
    }
}

module.exports = getusers;