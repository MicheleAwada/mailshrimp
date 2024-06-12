import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Paper, TextField, Typography } from "@mui/material"
import { useFullFetcherAction } from "../api-utils"
import Spinner from "../components/spinner"
import PassInput from "../components/passInput";
import { useEffect } from "react";
import { setConfigUser } from "../api";
import { useConfig } from "../components/configContext";

function Login() {
  const { fetcher, getFromName, errorState: [error], loading } = useFullFetcherAction({ useGetFromNameProps: { disableFieldState: true } })

  const configState = useConfig()

  const response = fetcher.data
  useEffect(() => {
    if (response?.succeeded) {
      setConfigUser({ userData: response.data, configState })
    }
  }, [response])
  
  return (
    <>
    <Box sx={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Paper elevation={12} sx={{ px: 4, py: 3, width: "16rem" }}>
        <fetcher.Form method="POST" action="/login/">
          <Typography variant="h4" align="center" mb={4}>Login</Typography>
          <Stack alignItems="center">
            <Stack alignItems="center" spacing={2}>
              <TextField fullWidth required variant="outlined" autoComplete="mailshrimp-username" {...getFromName("username")} />
              <PassInput fullWidth required variant="outlined" autoComplete="mailshrimp-password" {...getFromName("password")} />
            </Stack>
            <Typography my={1} color="error">{error.errorMessage || ""}</Typography>
            <Button variant="contained" type="submit" disabled={loading} startIcon={loading ? <Spinner /> : undefined}>{"Login"}</Button>
          </Stack>
        </fetcher.Form>
      </Paper>
    </Box>
    </>
  )
}

export default Login