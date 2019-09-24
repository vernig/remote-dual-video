const Video = Twilio.Video;
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
  console.log('Connected to room ' + room.sid);
  // Send text message
  fetchJson('/invite', {
    to: document.getElementById('customer-number').value,
    url: `https://${window.location.hostname}/client/?room=${encodeURIComponent(room.name)}`
  });
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

function fetchJson(url, body) {
  return fetch(url, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(response => response.text());
}

document.getElementById('connect').onclick = async function() {
  if (!document.getElementById('customer-number').value) {
    alert('You need to specify the customer phone number');
    return;
  }
  let customerNumber = document.getElementById('customer-number').value;
  // Get a token
  let token = await fetchToken();
  // Create a room
  let roomName = await fetchJson('/create-room', {
    recording: document.getElementById('recording').attributes[
      'data-toggle'
    ].value,
    name: customerNumber
  });
  if (roomName) {
    // Create the Video and join the room
    var connectOptions = {
      name: roomName,
      video: true,
      audio: false
    };
    Video.connect(token.token, connectOptions).then(roomJoined, function(
      error
    ) {
      log('Could not connect to Twilio: ' + error.message);
    });
    updateUI('connecting');
  }
};

document.getElementById('disconnect').onclick = function() {
  videoRoom.disconnect();
  updateUI('disconnected');
};

document.getElementById('recording').onclick = function(event) {
  let button = event.target;
  let recordingToggle = button.attributes['data-toggle'].value === 'true';
  if (recordingToggle) {
    button.classList.add('btn-secondary');
    button.classList.remove('btn-primary');
    button.textContent = 'Recording off';
  } else {
    button.classList.add('btn-primary');
    button.classList.remove('btn-secondary');
    button.textContent = 'Recording on';
  }
  button.attributes['data-toggle'].value = (!recordingToggle).toString();
};
