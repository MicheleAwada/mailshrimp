import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Paper, TextField, Typography } from "@mui/material"
import { useFullFetcherAction } from "../api-utils"
import Spinner from "../components/spinner"

function Login() {
  const { fetcher, getFromName, errorState: [error], loading } = useFullFetcherAction({ useGetFromNameProps: { disableFieldState: true } })
  console.log(error)
  return (
    <>
    <Box sx={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Paper elevation={12} sx={{ px: 4, py: 3 }}>
        <fetcher.Form method="POST" action="/login/">
          <Typography variant="h4" align="center" mb={4}>Login</Typography>
          <Stack alignItems="center" spacing={2}>
            <TextField variant="outlined" autoComplete="mailshrimp-username" {...getFromName("username")} />
            <TextField variant="outlined" autoComplete="mailshrimp-password" {...getFromName("password")} />
            <Typography color="error">{error.errorMessage}</Typography>
            <Button variant="contained" type="submit" fullWidth startIcon={loading ? <Spinner /> : undefined}>{loading ? "" : "Login"}</Button>
          </Stack>
        </fetcher.Form>
      </Paper>
    </Box>
    </>
  )
}

export default Login