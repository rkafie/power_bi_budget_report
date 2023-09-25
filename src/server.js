// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------
const dotenv = require('dotenv').config();
const fs = require('fs');

// if(fs.existsSync("config/config.json")){
//     console.log("Directory exists");
// }else{
//     fs.writeFileSync('config/config.json',JSON.stringify({
//         "authenticationMode": process.env.authenticationMode,
//         "authorityUrl": process.env.authorityUrl,
//         "scopeBase": process.env.scopeBase,
//         "powerBiApiUrl": process.env.powerBiApiUrl,
//         "clientId": process.env.clientId,
//         "workspaceId": process.env.workspaceId,
//         "reportId": process.env.reportId,
//         "clientSecret": process.env.clientSecret,
//         "tenantId": process.env.tenantId
//     }
//     ))
// }


// addUser();

let path = require('path');
let embedToken = require(__dirname + '/embedConfigService.js');
const utils = require(__dirname + "/utils.js");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwtoken = require('jsonwebtoken');
mongoose.connect(process.env.mongoUrl);
const userSchema = new mongoose.Schema({
    username:String,
    password:String
})
const User = new mongoose.model('User',userSchema);

// Prepare server for Bootstrap, jQuery and PowerBI files
app.use('/js', express.static('./node_modules/bootstrap/dist/js/')); // Redirect bootstrap JS
app.use('/js', express.static('./node_modules/jquery/dist/')); // Redirect JS jQuery
app.use('/js', express.static('./node_modules/powerbi-client/dist/')) // Redirect JS PowerBI
app.use('/css', express.static('./node_modules/bootstrap/dist/css/')); // Redirect CSS bootstrap
app.use('/public', express.static('./public/')); // Use custom JS and CSS files

const port = process.env.PORT || 5300;



app.use(bodyParser.json());


app.use(bodyParser.urlencoded({
    extended: true
}));

async function checkUser(req,res,next){
    console.log(req.body);
    let user = await User.findOne({username:req.body.username});
    console.log(user);
    if(user){
        let passwordMatches = await bcrypt.compare(req.body.password,user.password);
        if(passwordMatches){
            next();
        }else{
            res.send("Wrong credentials");
        }
    }else{
        res.send("User not found");
    }
}


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../views/login.html'));
});

app.post('/report', checkUser, function (req, res) {
    res.sendFile(path.join(__dirname + '/../views/index.html'));
});

app.get('/getEmbedToken', async function (req, res) {

    // Validate whether all the required configurations are provided in config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult) {
        console.log(10001);
        return res.status(400).send({
            "error": configCheckResult
        });
    }

    // Get the details like Embed URL, Access token and Expiry
    let result = await embedToken.getEmbedInfo(); 
    console.log(result);
 

    // result.status specified the statusCode that will be sent along with the result object
    res.status(result.status).send(result);
});

app.listen(port, () => console.log(`Listening on port ${port}`));