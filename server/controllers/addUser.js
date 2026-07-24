const {query} = require("../config/db");

const adduser = async(req , res)=> {
    try{
        const result = await query("INSERT INTO users (id , name , age) VALUES (2 , 'Hriday' , 20)");
        res.json({
            success : true,
            message : "the data has been added ot the database"
        });
    }
    catch(error){
        console.log(error);
    }
}

module.exports = adduser;