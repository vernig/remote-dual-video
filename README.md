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
