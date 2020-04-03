# Remote video viewer

This is a proof of concept for a remote video chat application using Twilio Video Chat. In this PoC an agent is inviting a user to connect a video chat room. Once connected the user's mobile phone is streaming video from both cameras as well as orientation data to the desktop app. 

Below is a screenshot of the interface of both the desktop and the mobile phone:

![screenshot](https://user-images.githubusercontent.com/54728384/65513021-527e0600-ded2-11e9-93bb-b50487d577f4.png)

This demo is using: 

* Twilio messaging API to invite a mobile phone and share Video Chat room information
* Twilio Video Chat APIs to: 
  * Create a room (with and without recording) 
  * Stream both videos from the mobile phone to the desktop 
  * Use the Video Chat Data track to share mobile phone orientation data

# Quick start 
* Clone the repo
```
git clone https://github.com/vernig/remote-dual-video.git
```
* Install dependencies 
```
npm install
```
* Copy the `.env.template` into `.env` and fill in the required information: 
  * `TWILIO_ACCOUNT_SID`: your Twilio account SID
  * `TWILIO_ACCOUNT_SECRET`: your Twilio auth token
  * `TWILIO_API_KEY`: A new or existing Twilio API key. You can generate a new one [here](https://www.twilio.com/console/video/project/api-keys)
  * `TWILIO_API_SECRET`: The secret of the API key `TWILIO_API_KEY`
  * `FROM`: The from number used to send SMS to the remote client with the room info
* Start the project:
```
npm start 
``` 

# Key procedures
## Acquire both cameras on the mobile: 
In order to acquire both camera, ` navigator.mediaDevices.enumerateDevices()` is used to enumerate all the devices. For each of the video devices, a new LocalVideoTrack is created using:
```javascript
Video.createLocalVideoTrack({ deviceId: inputDeviceInfo.deviceId }) 
```
and added to an array (i.e. `availableLocalVideoTracks`). The array is then used in the options for the `Video.connect()` call:

```javascript
connectOptions = {
  name: roomName,
  tracks: availableLocalVideoTracks
};
Video.connect(token.token, connectOptions)
```

See more in [client.js](https://github.com/vernig/remote-video/blob/master/public/client/client.js)

## Recordings

The Javascript Video SDK doesn't include any API for creating the room. When the `Video.connect()` is used an _ad-hoc_ room is created and it's using the default settings from the room defined in the Twilio console. In order to set the recording option for the room, this is created on the [server](https://github.com/vernig/remote-video/blob/master/server/index.js) using the option `recordParticipantsOnConnect` in `client.video.rooms.create()`. Also, before creating a room, the server is checking if the room exists already, and if it does, the old room status is set to `completed`

```javascript
let existingRooms = await client.video.rooms.list({uniqueName: request.body.name})
  if (existingRooms.length > 0) {
    await client.video.rooms(existingRooms[0].sid).update({status: 'completed'})
  }
  let newRoom = await client.video.rooms.create({
    recordParticipantsOnConnect: recordingOption,
    type: 'group',
    uniqueName: roomName
  })
 ```
 
 ## Mobile orientation data 
 
After the room is joined, the client creates and publishes a new data track:

```javascript
function createDataTrack(room) {
  localDataTrack = new Video.LocalDataTrack();
  room.localParticipant.publishTrack(localDataTrack);
}
```
And then the `window.ondeviceorientation` event is used to send orientation data to the other peer (i.e. the desktop app):

```javascript
window.ondeviceorientation = function(event) {
  if (localDataTrack) {
    localDataTrack.send(
      `{"kind": "orientation", "data": {"alpha": ${event.alpha}, "beta": ${event.beta}, "gamma": ${event.gamma}}}`
    );
  }
};
```

## Disconnect from a room
 
It's very important to note that disconnecting from a room is not enough to stop capturing the video from the camera. Two things needs to be done for that: 
* Stop the track
* Detach the track from any DOM element it was attached

This is implemented in the [helper.js](https://github.com/vernig/remote-video/blob/master/public/lib/helpers.js) (since it's common to both client and server) in the handling of the room `disconnect` event:

```
room.on('disconnected', function(room, error) {
    room.localParticipant.tracks.forEach(function(track) {
      if (track.stop) {
        track.stop();
      }
      if (track.detach) {
        track.detach().forEach(detachedElement => {
          if (detachedElement) {
            detachedElement.remove();
          }
        });
      }
    });
 ```
 Note how the existance of both `stop` and `detach` method are checked before using them. Some of the tracks (e.g. data track) do not have these methods. 
