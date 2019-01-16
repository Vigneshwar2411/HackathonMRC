const express = require('express');
const https = require('https');
const app = express();
const bodyparser = require('body-parser');
const apiai = require('apiai');

const apiaiApp = apiai("a34a7f7d076a471092d0a0b218c030c9");


const accountSid = 'ACb57b9327345e9144862523460fc994e4';
const authToken = 'e05522f14626cec8977282010fc1feed';
const client = require('twilio')(accountSid, authToken);
var prevIntent = 'first';

var httpsOptions = {
  hostname: 'api-preprod.mrcooper.com',
  path: '/nsm/preprod/api/v1/customers/100540019/loans/596852278/profile?emailCascade=none',
  method: 'POST',
  headers: {
       'Content-Type': 'application/json',
       'X-IBM-Client-Id': 'e9cb1352-55c2-4884-abef-032a961f7e5e',
      'brand-name':'NSM',
      'Accept':'application/json',
      'applicationid':'my-application-id'
    }
};

const options = new URL('https://api-preprod.mrcooper.com/nsm/preprod/api/v1/customers/100540019/loans/596852278/profile?emailCascade=none');

const postData = JSON.stringify({
"communications": [
            {
              "communication_type": {
                "code" : "Email"
              },
              "communication_type_value" : "vigneshwar.sb@mrcooper.com"
            }
          ]
});

app.use(bodyparser.json());

app.use(bodyparser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.send('Hurray Im Up, Get Hacked!');
});

app.post('/sendOneWayMessage', function(req, res) {
  client.messages
        .create({
          body: "Hi I'm Cooper! Mrcooper is on WhatsApp now. Let us know if have any queries.",
          from: 'whatsapp:+14155238886',
          to: 'whatsapp:+919566459966'
        })
        .then(message => console.log("message id",message.sid))
        .done();
  res.send('your one way message on its way')
})

app.post('/updateEmail', function(req, res) {
  console.log('update email......call through webhook');
  var httpsRequest = https.request(options, (httpsResponse) => {
    console.log('httpsResponse code',httpsResponse.statusCode);
    httpsResponse.on('data', (d) => {
      console.log('httpsResponse response',d);
      client.messages
            .create({
              body: "Your request to update email is complete",
              from: 'whatsapp:+14155238886',
              to: 'whatsapp:+919566459966'
            })
            .then(message => console.log("message id",message.sid))
            .done();

      res.send('email updated successfully')
  });
  })

  httpsRequest.on('error', (e) => {
    console.error('httpsRequest error',e);
  });

  httpsRequest.write(postData);
  httpsRequest.end();
})

app.post('/interactive', function(req,res) {
  let reqText = req.body.Body;
  const emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
  console.log('prevIntent',prevIntent);
  console.log('reqText',reqText);
  console.log(reqText.match(emailPattern));

  reqText = reqText.match(emailPattern) ? 'it is an email' : prevIntent.toLowerCase() === 'update email' ? 'not a valid email' : reqText;

  const apiaiRequest = apiaiApp.textRequest(reqText, {
    sessionId: 'unique'
  });

  apiaiRequest.on('response', function(response) {
    console.log('repsone',response);
    prevIntent = response.result.metadata.intentName;
    console.log('apiapi.......',response.result.fulfillment.speech);
    const body = response.result.fulfillment.speech;
    client.messages
          .create({
            body: body,
            from: req.body.To,
            to: req.body.From
          })
          .then(message => console.log("message id",message.sid))
          .done();
    res.send('I have replied you from node application');
  });

  apiaiRequest.end();

})

app.listen(process.env.PORT || 3080, function () {
  console.log('Example app listening on port 3080!');
});
