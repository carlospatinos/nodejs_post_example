var moment = require('moment');
var fs = require('fs');
var jwt = require('jsonwebtoken');
const request = require('request');

const dotenv = require('dotenv');
dotenv.config();

// optain this from DCA
const PURE_CLOUD_TOKEN=process.env.PURE_CLOUD_TOKEN;
const SANDBOX=process.env.SANDBOX;
const ORG = process.env.ORG;
const API_KEY = process.env.API_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const PURE_CLOUD_CREDENTIALS_ID = process.env.PURE_CLOUD_CREDENTIALS_ID;
const PURE_CLOUD_CREDENTIALS_NAME = process.env.PURE_CLOUD_CREDENTIALS_NAME;

const PRIVATE_KEY=process.env.PRIVATE_KEY;
const PUBLIC_KEY=process.env.PUBLIC_KEY;

var payload = { 
   "iss": ORG,
   "sub": "47B818545E2713A60A495CA8@techacct.adobe.com",
   "https://ims-na1.adobelogin.com/s/ent_dataservices_sdk": true,
   "aud": "https://ims-na1.adobelogin.com/c/028701d486e6423fa0fe618b89e94d22"
};

// PRIVATE and PUBLIC key
var privateKey  = fs.readFileSync(PRIVATE_KEY, 'utf8');
var publicKey  = fs.readFileSync(PUBLIC_KEY, 'utf8');
var token = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '2m' });
try {
   jwt.verify(token, publicKey,function(err, decoded) {
      console.log(decoded) 
    });
} catch(err) {
   console.log(err);
}
console.log("=============================");

console.log("JWT_TOKEN: \n");
console.log(token);
console.log("=============================");

const adobeOps = {
   url: 'https://ims-na1.adobelogin.com/ims/exchange/jwt',
   headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/x-www-form-urlencoded'
   }, 
   form: {
      client_secret: CLIENT_SECRET, client_id: API_KEY, jwt_token: token
   }
 };
 
 request.post(adobeOps, function(err,httpResponse,body){ /* ... */ 
      if(err) {
         console.log("Error from Adobe.");
         console.log(err);
      } else {
         const ADOBE_TOKEN=JSON.parse(body).access_token;
         console.log("------------------------- \n");
         console.log("Updating data actions on dca ");
         console.log("authorization: Bearer " + ADOBE_TOKEN);
         console.log("sandbox: " + SANDBOX);
         console.log("org: " + ORG);
         console.log("apikey: " + API_KEY);

         // ff3ad1ff-7b7f-4544-8250-46a2170f1c6b
         const pureCloudOps = {
            url: 'https://apps.inindca.com/platform/api/v2/integrations/credentials/0e839bf1-1546-4c20-9637-f8f1de9a0397',
            headers: {
               'Authorization': 'bearer ' + PURE_CLOUD_TOKEN,
               'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({
                  "id":PURE_CLOUD_CREDENTIALS_ID,
                  "name":PURE_CLOUD_CREDENTIALS_NAME,
                  "type":"userDefined",
                  "credentialFields":{
                     "authorization":"Bearer " + ADOBE_TOKEN,
                     "sandbox": SANDBOX, 
                     "org": ORG,
                     "apikey": API_KEY
                     
            }})
          };

         request.put(pureCloudOps, function(err2,httpResponse2,body2){ /* ... */ 
            if(err2) {
               console.log("Error on PureCloud.");
               console.log(err2);
            } else {
               console.log("Update your PC token if you get a 401")
               console.log(body2);
            }
         });
      }
});