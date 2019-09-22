const Video = Twilio.Video;
var urlParams = new URLSearchParams(window.location.search);
localTracks = [];
var clientToken;
var localDataTrack;

async function getVideoDevicesMediaStreamTracks() {
  // To make this code more readable, this is an async function
  // In production promises can be used instead for wider compatibility
  let mediaStreamTracks = [];
  let deviceInfos = await navigator.mediaDevices.enumerateDevices();
  let videoDeviceInfos = deviceInfos.filter(
    deviceInfo => deviceInfo.kind === 'videoinput'
  );

  // To make this code more readable, we hardcode the two cameras
  // Production code can use Promise.all() to create one single promise
  let camera1 = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: videoDeviceInfos[0].deviceId },
    audio: false
  });
  let camera2 = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: videoDeviceInfos[1].deviceId },
    audio: false
  });
  mediaStreamTracks.push(camera1.getTracks()[0]);
  mediaStreamTracks.push(camera2.getTracks()[0]);
  return mediaStreamTracks;
}

function createDataTrack(room) {
  localDataTrack = new Video.LocalDataTrack();
  room.localParticipant.publishTrack(localDataTrack);
}

function roomJoined(room) {
  console.log(`${room.room}`);
  initRoomEvents(room);
  createDataTrack(room);
}

document.getElementById('connect').onclick = function(event) {
  fetchToken().then(token => {
    clientToken = token;
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

window.ondeviceorientation = function(event) {
  if (localDataTrack) {
    localDataTrack.send(
      `{"kind": "orientation", "data": {"alpha": ${event.alpha}, "beta": ${event.beta}, "gamma": ${event.gamma}}}`
    );
  }
};

document.getElementById('cancle').onclick = function () {
  document.getElementById('confirm-screen').style.display = hidden
}
