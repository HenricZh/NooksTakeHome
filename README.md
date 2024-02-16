## Nooks Watch Party Project

In this takehome project, we want to understand your:
- ability to build something non-trivial from scratch
- comfort picking up unfamiliar technologies
- architectural decisions, abstractions, and rigor

We want to respect your time, so please try not to spend more than 5 hours on this. We know that this is a challenging task & you are under time pressure and will keep that in mind when evaluating your solution.

### Instructions

To run the app simply "npm i" in both "./backend" and "./fronted" and then "npm start" in both files again.

### Problem
Your task is to build a collaborative “Watch Party” app that lets a distributed group of users watch youtube videos together. The frontend should be written in Typescript (we have a skeleton for you set up) and the backend should be written in Node.JS. The app should support two main pages:

- `/create` **Create a new session**
    - by giving it a name and a youtube video link. After creating a session `ABC`, you should be automatically redirected to the page `/watch` page for that session
- `/watch/:sessionId` **Join an existing session**
    
    *⚠️ The player must be **synced for all users at all times** no matter when they join the party*
    
    - **Playing/pausing/seek** the video. When someone plays/pauses the video or jumps to a certain time in the video, this should update for everyone in the session
    - **Late to the party**... Everything should stay synced if a user joins the session late (e.g. if the video was already playing, the new user should see it playing at the correct time)
        
### Assumptions

- This app obviously **doesn’t need to be production-ready**, but you should at least be aware of any issues you may encounter in more real-world scenarios.
- We gave you all of the frontend UX you’ll need in the [starter repo](https://github.com/NooksApp/nooks-fullstack-takehome), including skeleton pages for the `create` and `watch` routes, so you can focus on implementing the core backend functionality & frontend video playing logic for the app.
- You should probably use **websockets** to keep state synchronized between multiple users.

You will need to embed a Youtube video directly in the website. In our skeleton code we use [react-player](https://www.npmjs.com/package/react-player), but feel free to use another library or use the [Youtube IFrame API](https://developers.google.com/youtube/iframe_api_reference) directly.

In order to sync the video, you’ll need to know when any user plays, pauses, or seeks in their own player and transmit that information to everyone else. In order to get play, pause, and seek events you can use:
1. [YouTube iFrame API - Events](https://developers.google.com/youtube/iframe_api_reference#Events)
2. Build your own custom controls for play, pause & seek. If you choose  this option, make sure the controls UX works very similarly to youtube’s standard controls (e.g. play/pause button and a slider for seek)

### Required Functionality

- [x] **Creating a session**. Any user should be able to create a session to watch a given Youtube video.
- [x] **Joining a session**. Any user should be able to join a session created by another user using the shareable session link.
- [x] **Playing/pausing** the video. When a participant pauses the video, it should pause for everyone. When a participant plays the video, it should start playing for everyone.
- [x] **“Seek”**. When someone jumps to a certain time in the video it should jump to that time for everyone.
- [x] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [x] **Player controls.** All the player controls (e.g. play, pause, and seek) should be intuitive and behave as expected. For play, pause & seek operations you can use the built-in YouTube controls or disable the YouTube controls and build your own UI (including a slider for the seek operation)

🚨 **Please fill out the rubric in the README with the functionality you were able to complete**


### Architecture Questions

After building the watch party app, we would like you to answer the following questions about design decisions and tradeoffs you made while building it. Please fill them out in the README along with your submission.

1. **How did you approach the problem? What did you choose to learn or work on first? Did any unexpected difficulties come up - if so, how did you resolve them?**
The first thing I did was learn about web sockets. I have heard about web sockets through youtube videos in the past and I knew that I
could keep an open connection for fast communication. This would be required for the syncrhonous nature of a watch party application.
I started by searching up documentation and the libraries I would use to use web sockets in my application. I came across socket.io
and websockets (ws) for node.js. I initially started using websockets but that would take me too long as it is real bare bones compared
to socket.io which has a lot of features that I would need built in. I also initially thought about using redis (since it is a main
memory db so I thought it would be fast) to store sessions but not only are there issues with storing connections as a key:value pair
in redis it would be slower than just having a list in node.js. From there, I wrote routes to register watch parties and methods in the
websocket connection to deal with pasuing, playing, seeking, and joining. Most of the issues came with dealing with seeking/synching so
nothing was unexpected. I resolved all issues with pausing, playing, and seeking as described below. I also had some smaller issues with setting up cors and stuff but that was easily fixable by searching on stack overflow.

2. **How did you implement seeking to different times in the video? Are there any other approaches you considered and what are the tradeoffs between them?**
I implemented seeking by utilizing play and pause. I noticed that everytime I seek, the player emits pause/play events. So I make
sure to pause all people and unpause after a seek is done. This way, after a seek, everyone default to the play event and will start
playing at the time chosen by the seeker. The downsides to using this approach is that everyone gets paused whenever someone syncs,
so this is subject to people not randomly moving the slider to troll. The other issue is that if someone has really slow wifi,
they may be out of sync since the time it takes to change everyone else's time in the video will be too slow. This means the video will
keep playing while everyone else is synching to an old time stamp.

Some other approaches I considered were writing my own slider so that I wouldn't have to pause while someone slides. I also considered comparing timestamps from the progress events. There would be a seek if the time jumps too much (say >= 1 second). On a jump, then I
could send a seek message and adjust the time for everyone to the new timestamp. This is a much more complex design in terms of dealing
with state on the frontend. There may be issues with stuttering.

3. **How do new users know what time to join the watch party? Are there any other approaches you considered and what were the tradeoffs between them?**
I considered the easiest method which is just to take the timestamp value stored in each session object on the backend. However, the issue
with this is that someone might not click the watch button right after pasting in the URL. This would start them on an older timestamp so
they would be behind. Thus, I needed a way to synch the value saved in the session object once the button is actually clicked. I used
a polling method where I just ask all of the current watchers what the time stamp is. Since they are in synch, then the value they set
will be what everyone will be watching. This is basically a handshake that asks for the most recent timestamp. I also considered for
each client to just tell the late joiner what the current timestamp was. The difference is the server may get stale data with this approach. I think it makes more sense to have some delay on the joiner and for the server to update the session object since the server
is the source of truth.

4. **How do you guarantee that the time that a new user joins is accurate (i.e perfectly in sync with the other users in the session) and are there any edge cases where it isn’t? Think about cases that might occur with real production traffic.**
I guarantee the join time is accurate via a handshake to make sure the timestamp stored in the session object on the backend is accurate. I do so by polling the current time stamp from all people currently watching. Then I send that value to the joiner. The issues with this is that the time it takes to send these messages between the server and watchers may result in inaccuracies. So, if someone has slow connection, then the updated timestamp may not truly be accurate anymore as the video kept on playing. This gap is not as bad with normal connection speeds since the recorded timestamp will be pretty close to what timestamp the watchers are at after sending the messages.

5. **Are there any other situations - i.e race conditions, edge cases - where one user can be out of sync with another? (Out of sync meaning that user A has the video playing or paused at some time, while user B has the video playing or paused at some other time.)**
Depending on how we define out of sync (by the second, ms, ns), there will always be issues regarding being in sync. Since it takes time to update where the current video is, this would mean whoever is recieving a timestamp would always be behind. There may also be race conditions for playing/pausing that occur. I tried to use the pause value in the session object as a "lock" that prevents spamming pause and only recognizes the first pause that it recieves. There could weird cases where two different commands get called in at the same time which could result in things being out of sycnh. Say there was a pause and a updateTime that came in at the same time. If update time wins the race condition and gets dealt with first, it could take a long time which would force the pause to wait. This would look real weird to the user as they pressed pause but things are pausing.

6. **How would you productionize this application to a scale where it needs to be used reliably with 1M+ DAUs and 10k people connected to a single session? Think infrastructure changes, code changes & UX changes.**
I believe socket.io is built to scale but we will forsure need to scale to multiple ws servers. Currently, I am keeeping track of all
sessions in memory so that will probably have to get moved to a database as there become a lot of sessions. Using a DB may also result
in additional lag due to the async nature of making queries. In my late join code, I may also need to be more specific about who to ask
for the most recent time. For UX, I think adding a workflow for after a video is finished watching could be nice.

🚨 **Please fill out this section in the README with answers to these questions, or send the answers in your email instead.**

### Help & Clarifications

If you want something about the problem statement clarified at any point while you’re working on this, feel free to **email me** at nikhil@nooks.in or even **text me** at 408-464-2288. I will reply as soon as humanly possible and do my best to unblock you.

Feel free to use any resource on the Internet to help you tackle this challenge better: guides, technical documentation, sample projects on Github — anything is fair game! We want to see how you can build things in a real working environment where no information is off limits.

### Submission

When you’ve finished, please send back your results to me (nikhil@nooks.in) and CC our recruiting lead Kev (kev@nooks.in) via email as a **zip file**. Make sure to include any instructions about how to run the app in the README.md. 

I will take a look and schedule a time to talk about your solution!

