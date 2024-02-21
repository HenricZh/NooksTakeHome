import { Box, Button, Slider } from "@mui/material";
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
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(100);

  const socket = React.useMemo(() => {
    return io("http://localhost:8080");
  }, []);

  useEffect(() => {

    socket.on("pause", (timestamp: any) => {
      console.log("Pausing video at time: ", timestamp);
      setPlaying(false);
      setProgress(timestamp);
      player.current?.seekTo(timestamp);
      
    });

    socket.on("play", (timestamp: any) => {
      console.log("Playing video at time: ", timestamp);
      setPlaying(true);
      setProgress(timestamp);
      player.current?.seekTo(timestamp);
      
    });

    socket.on("pollTimestamp", (socket_id, curPause) => {
      if (player.current?.getCurrentTime() && socket.id === socket_id) {
        if (curPause) {
          socket.emit("updateTime", sessionId, player.current?.getCurrentTime());
        } else {
          socket.emit("updateTime", sessionId, player.current?.getCurrentTime()+0.5); // 0.5 to account for lag
        }
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
    if (player.current?.getDuration()) {
      console.log("sent");
      let endDur = player.current?.getDuration();
      socket.emit("pause", sessionId, endDur);
      player.current?.seekTo(endDur);
      setPlaying(false);
    }
  };

  const handleSeek = (percent: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?
    if (playing) {
      let endDur = player.current?.getDuration();
      if (endDur) {
        socket.emit("updateTime", sessionId, endDur*percent/100);
        player.current?.seekTo(endDur*percent/100);
      }
    } else {
      let endDur = player.current?.getDuration();
      if (endDur) {
        console.log(endDur*percent/100);
        socket.emit("updateTime", sessionId, endDur*percent/100);
        player.current?.seekTo(endDur*percent/100);
        setPlaying(false);
      }
    }
  };

  const handlePlay = () => {
    const time = player.current?.getCurrentTime();
    console.log(
      "User played video at time: ",
      time
    );
    socket.emit("play", sessionId, time);
    setPlaying(true);
  };

  const handlePause = () => {
    const time = player.current?.getCurrentTime();
    console.log(
      "User paused video at time: ",
      time
    );
    socket.emit("pause", sessionId, time);
    setPlaying(false);
  };

  const handleBuffer = () => {
    console.log("Video buffered");
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
    setProgress(state.playedSeconds)
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
        <Slider value={100*progress/duration} onChange={(e:any) => handleSeek(e.target.value)} />
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
            setDuration(player.current?.getDuration() ? player.current?.getDuration() : 100);
          }}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
