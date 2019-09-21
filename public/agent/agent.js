const Video = Twilio.Video;
const ROOM_NAME = 'iInsurance';
var videoRight = false;

function roomJoined(room) {
  console.log('Connected to room');
  initRoomEvents(room);

  let selfVideo = document.getElementById('video-self');
  selfVideo.appendChild(
    Array.from(room.localParticipant.videoTracks.values())[0].attach()
  );

  document.getElementById('video-left').textContent =
    'Waiting for the customer to connect...';
  document.getElementById('video-right').textContent =
    'Waiting for the customer to connect...';

  // Override default trackAdded event in helpers
  room.on('trackAdded', function(track, participant) {
    videoRight = !videoRight;
    log(participant.identity + ' added track: ' + track.kind);
    let targetElement = videoRight
      ? document.getElementById('video-right')
      : document.getElementById('video-left');
    targetElement.textContent = '';
    targetElement.style['padding-top'] = 0;
    targetElement.style['border'] = 0;
    targetElement.appendChild(track.attach());
  });

  // Change button's aspect
  connectButton = document.getElementById('connect');
  connectButton.classList.disabled = false;
  connectButton.classList.add('btn-danger');
  connectButton.textContent = 'Disconnect';
}

document.getElementById('connect').onclick = async function() {
  // Change button's aspect
  event.target.classList.add('btn-secondary');
  event.target.classList.disabled = true;
  event.target.textContent = 'Connecting...';

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
};
