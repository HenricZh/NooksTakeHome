import { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import React from "react";
import axios from "axios";

const WatchSession: React.FC = () => {

  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    console.log(sessionId)
    // find url from backend
    if (sessionId !== "undefined") {
      console.log(sessionId)
      axios.get(`http://localhost:8080/watch/${sessionId}`)
      .then((resp) => {
        // socket.emit("join", sessionId);
        setUrl(resp.data.videoUrl);
      })
      .catch((err) => {
        console.log(err);
        // if session ID doesn't exist, you'll probably want to redirect back to the home / create session page
        navigate("/create")
      });
    } else {
      navigate("/create")
    }
  }, [sessionId, navigate]);

  if (!!url) {
    return (
      <>
        <Box
          width="100%"
          maxWidth={1000}
          display="flex"
          gap={1}
          marginTop={1}
          alignItems="center"
        >
          <TextField
            label="Youtube URL"
            variant="outlined"
            value={url}
            inputProps={{
              readOnly: true,
              disabled: true,
            }}
            fullWidth
          />
          <Tooltip title={linkCopied ? "Link copied" : "Copy link to share"}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              disabled={linkCopied}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <LinkIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Create new watch party">
            <Button
              onClick={() => {
                navigate("/create");
              }}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <AddCircleOutlineIcon />
            </Button>
          </Tooltip>
        </Box>
        <VideoPlayer url={url} sessionId={sessionId} />;
      </>
    );
  }

  return null;
};

export default WatchSession;
