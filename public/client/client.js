const Video = Twilio.Video;
var urlParams = new URLSearchParams(window.location.search);
localTracks = [];

async function getVideoDevicesMediaStreamTracks() {
    // To make this code more readable, this is an async function 
    // In production promises can be used instead for wider compatibility
    let mediaStreamTracks = []
    let deviceInfos = await navigator.mediaDevices.enumerateDevices()
    let videoDeviceInfos = deviceInfos.filter(deviceInfo => deviceInfo.kind === 'videoinput')
    // To make this code more readable, we hardcode the two cameras
    // Production code can use Promise.all() to create one single promise
    let camera1 = await navigator.mediaDevices.getUserMedia({video: {deviceId: videoDeviceInfos[0].deviceId}, audio: false})
    let camera2 = await navigator.mediaDevices.getUserMedia({video: {deviceId: videoDeviceInfos[1].deviceId}, audio: false})
    mediaStreamTracks.push(camera1.getTracks()[0])
    mediaStreamTracks[0].contentHint = "front"
    mediaStreamTracks.push(camera2.getTracks()[0])
    mediaStreamTracks[1].contentHint = "back"
    return mediaStreamTracks
  }

function roomJoined(room) {
  console.log(`${room.room}`);
  initRoomEvents(room);
}

document.getElementById('connect').onclick = function(event) {
  fetchToken().then(token => {
    getVideoDevicesMediaStreamTracks().then(videoDevicesMediaStreamTracks => {
      // For demo pourpose, we don't use any audio (to avoid echo)
      var connectOptions = {
        name: urlParams.get('room'),
        tracks: videoDevicesMediaStreamTracks
      };
      Video.connect(token.token, connectOptions).then(roomJoined, function(
        error
      ) {
        log('Could not connect to Twilio: ' + error.message);
      });
    });
  });
};
