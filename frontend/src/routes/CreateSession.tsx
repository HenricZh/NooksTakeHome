import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField } from "@mui/material";
import React from "react";
import axios from "axios";

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");

  const createSession = async () => {
    
    // create session
    await axios.post('http://localhost:8080/create', {
      videoUrl: videoUrl
    }).then((resp) => {
      setVideoUrl("");
      navigate(`/watch/${resp.data.sessionId}`)
    }).catch((err) => {
      console.log(err);
    });
  };

  return (
    <Box width="100%" maxWidth={600} display="flex" gap={1} marginTop={1}>
      <TextField
        label="Youtube URL"
        variant="outlined"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        fullWidth
      />
      <Button
        disabled={!videoUrl}
        onClick={createSession}
        size="small"
        variant="contained"
      >
        Create a session
      </Button>
    </Box>
  );
};

export default CreateSession;
