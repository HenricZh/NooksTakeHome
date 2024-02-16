import { Box, Button } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { io } from "socket.io-client";

interface VideoPlayerProps {
  url: string;
  hideControls?: boolean;
  sessionId: string|undefined;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, hideControls, sessionId }) => {

  const [hasJoined, setHasJoined] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  // const [progress, setProgress] = useState(0);

  const socket = React.useMemo(() => {
    return io("http://localhost:8080");
  }, []);

  useEffect(() => {

    socket.on("pause", (timestamp) => {
      console.log("Pausing video at time: ", timestamp);
      player.current?.seekTo(timestamp);
      setPlaying(false);
    });

    socket.on("play", (timestamp) => {
      console.log("Playing video at time: ", timestamp);
      player.current?.seekTo(timestamp);
      setPlaying(true);
    });

    socket.on("pollTimestamp", (socket_id) => {
      if (socket.id !== socket_id) {
        socket.emit("updateTime", sessionId, player.current?.getCurrentTime());
      }
    });

    return () => {
      socket.off("play");
      socket.off("pause");
      socket.off("pollTimestamp");
    };
  }, [socket]);

  const player = useRef<ReactPlayer>(null);

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handleSeek = (seconds: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?

    // unused.
  };

  const handlePlay = () => {
    // setPlaying(true);
    const time = player.current?.getCurrentTime();
    console.log(
      "User played video at time: ",
      time
    );
    socket.emit("play", sessionId, time);
  };

  const handlePause = () => {
    // setPlaying(false);
    const time = player.current?.getCurrentTime();
    console.log(
      "User paused video at time: ",
      time
    );
    socket.emit("pause", sessionId, time);
  };

  const handleBuffer = () => {
    console.log("Video buffered");
    // let time = player.current?.getCurrentTime();
    // if (time) {
    //   console.log("buffered to: ", time);
    //   setProgress(time);
    // }
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box
        width="100%"
        height="100%"
        display={hasJoined ? "flex" : "none"}
        flexDirection="column"
      >
        <ReactPlayer
          ref={player}
          url={url}
          playing={hasJoined && playing}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            socket.emit("join", sessionId);
            setHasJoined(true);
          }}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
