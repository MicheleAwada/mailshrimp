import Box from "@mui/material/Box";
import { Button, Collapse, Paper, Stack, TextField, Typography } from "@mui/material"
import { useFullFetcherAction } from "../../api-utils.ts"
import InfinateNumInput from "../../components/infinateNumInput";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useEffect, useState } from "react";
import PassInput from "../../components/passInput.jsx";

function MailConfigDomain({  }) {
  const fieldState = useState({
    "domain_name": "",
    "quota": 0,
    "max_mailbox_quota": 0,
    "max_mailboxes": 0,
    "max_aliases": 0,
    "dkim_selector": "mail",
    "dkim_key_size": 2048,

  })
  const [fields, setFields] = fieldState
  const { getFromName, fetcher, } = useFullFetcherAction({
    useGetFromNameProps: {
      getFromNameOptions: {
        useFieldState: true,
      },
      fieldState: fieldState
    }
  })
  
  useEffect(() => {console.log("fields");console.log(fields)}, [fields])


  const [showMoreInfo, setShowMoreInfo] = useState()

  return <Paper height="100%">
    <Box sx={{ height: "100%", p: 4, boxSizing: "border-box" }}>
      <fetcher.Form method="POST">
        <Stack spacing={2}>
          <Stack alignItems="start" gap={2}>
            <TextField {...getFromName("fullname", { labelName: "Full Name", })} required />
            <TextField {...getFromName("username", { labelName: "User Name", helperText: "The left part of a email address" })} required />
            <PassInput {...getFromName("password", { labelName: "Password", })} />
            <InfinateNumInput showSizeType={true} name="quota" label="Quota" fieldState={fieldState} getFromName={getFromName} />
          </Stack>
          <Paper variant="outlined">
            <Box component="button" type="button" onClick={() => (setShowMoreInfo(!showMoreInfo))} sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.01)" }, backgroundColor: "transparent", cursor: "pointer", display: "flex", justifyContent: "start", alignItems: "center", py: 1, px: 4, width: "100%", border: "none", }}>
              <Typography>Show Additional Info</Typography>
                <Box sx={{ ml: 2, color: "white" }}>
                  <ExpandMoreIcon sx={{ transform: `rotate(${showMoreInfo ? 180 : 0}deg)`, transition: "transform 0.3s", }} />
                </Box>
            </Box>
            <Collapse in={showMoreInfo}>
              <Box p={4} display="flex" alignItems="center" gap={4} flexWrap="wrap">
                {/* <TextField {...getFromName("dkim_selector", { labelName: "DKIM Selector", })} />
                <TextField {...getFromName("dkim_key_size", { labelName: "DKIM Key Size", })} /> */}
              </Box>
            </Collapse>
          </Paper>
          <Button type="submit" variant="contained">Submit</Button>
        </Stack>
      </fetcher.Form>
    </Box>
  </Paper>
}

export default MailConfigDomain