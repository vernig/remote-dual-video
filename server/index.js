'use strict';

/**
 * Load Twilio configuration from .env config file - the following environment
 * variables should be set:
 * process.env.TWILIO_ACCOUNT_SID
 * process.env.TWILIO_API_KEY
 * process.env.TWILIO_API_SECRET
 */
require('dotenv').load();

var http = require('http');
var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var express = require('express');
var randomName = require('./randomname');
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_ACCOUNT_SECRET
);

// Create Express webapp.
var app = express();
app.use(express.static('public'));

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
/**
 * Generate an Access Token for a chat application user - it generates a random
 * username for the client requesting a token, and takes a device ID as a query
 * parameter.
 */
app.get('/token', function(request, response) {
  var identity = randomName();

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created.
  var token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );

  // Assign the generated identity to the token.
  token.identity = identity;

  // Grant the access token Twilio Video capabilities.
  var grant = new VideoGrant();
  token.addGrant(grant);

  // Serialize the token to a JWT string and include it in a JSON response.
  response.send({
    identity: identity,
    token: token.toJwt()
  });
});

app.post('/create-room', async function(request, response) {
  let existingRooms = await client.video.rooms.list({uniqueName: request.body.name})
  if (existingRooms.length > 0) {
    // Let's update the room status to complete
    console.log('Room existing. Set to complete')
    await client.video.rooms(existingRooms[0].sid).update({status: 'completed'})
  }
  let newRoom = await client.video.rooms.create({
    recordParticipantsOnConnect: request.body.recording === 'true',
    type: 'group',
    uniqueName: request.body.name
  })
  response.send(newRoom.uniqueName)
});

app.post('/invite', function(request, response) {
  client.messages
    .create({
      body:
        'Please use the following link to connect to your agent: ' +
        request.body.url,
      from: process.env.FROM,
      to: request.body.to
    })
    .then(message => {
      response.status(200).send(message.sid);
    })
    .catch(e => {
      consoles.log(e);
      response.status(500).send('Error sending SMS');
    });
});

// Create http server and run it.
var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
