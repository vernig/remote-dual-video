const Video = Twilio.Video;
const ROOM_NAME = 'iInsurance';
var videoRight = false;
var videoRoom;

function updateUI(status) {
  Array.from(document.getElementsByClassName('update-ui')).forEach(element => {
    element.classList.contains('show-' + status)
      ? (element.style.display = 'block')
      : (element.style.display = 'none');
  });

  switch (status) {
    case 'connecting':
      // Change connect button's aspect
      connectButton = document.getElementById('connect');
      connectButton.parentElement.style.display = 'block';
      connectButton.classList.add('btn-secondary');
      connectButton.disabled = true;
      connectButton.textContent = 'Connecting...';
      break;
    case 'connected':
      // Change connect button's aspect
      connectButton = document.getElementById('connect');
      connectButton.classList.remove('btn-secondary');
      connectButton.disabled = false;
      connectButton.textContent = 'Connect';
      break;
  }
}

function roomJoined(room) {
  console.log('Connected to room');
  videoRoom = room;
  initRoomEvents(room);

  let selfVideo = document.getElementById('video-self');
  selfVideo.appendChild(
    Array.from(room.localParticipant.videoTracks.values())[0].attach()
  );

  document.getElementById('video-left').textContent =
    'Waiting for the customer to connect...';
  document.getElementById('video-right').textContent =
    'Waiting for the customer to connect...';

  function addRemoveVideotrack(track) {
    videoRight = !videoRight;
    let targetElement = videoRight
      ? document.getElementById('video-right')
      : document.getElementById('video-left');
    targetElement.textContent = '';
    targetElement.style['padding-top'] = 0;
    targetElement.style['border'] = 0;
    targetElement.appendChild(track.attach());
  }

  function updateDeviceOrientation(data) {
    for (var key in data) {
      document.getElementById(
        'orientation-' + key
      ).style.transform = `rotate(${data[key]}deg)`;
    }
  }

  // Override default trackAdded event in helpers
  room.on('trackAdded', function(track, participant) {
    log(participant.identity + ' added track: ' + track.kind);
    if (track.kind === 'video') {
      addRemoveVideotrack(track);
    } else if (track.kind === 'data') {
      track.on('message', function(message) {
        updateDeviceOrientation(JSON.parse(message).data);
      });
    }
  });

  updateUI('connected');
}

document.getElementById('connect').onclick = async function() {
  // Send text message
  fetch('/invite', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: document.getElementById('customer-number').value,
      url: `https://${window.location.hostname}/client/?room=${ROOM_NAME}`
    })
  });

  // Create / Join Room
  let token = await fetchToken();
  var connectOptions = {
    name: ROOM_NAME,
    video: true,
    audio: false
    // logLevel: 'debug'
  };
  Video.connect(token.token, connectOptions).then(roomJoined, function(error) {
    log('Could not connect to Twilio: ' + error.message);
  });
  updateUI('connecting');
};

document.getElementById('disconnect').onclick = function() {
  videoRoom.disconnect();
  updateUI('disconnected');
};
