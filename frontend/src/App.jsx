import Box from "@mui/material/Box";
import './App.scss'

import { Outlet, useLoaderData, useLocation, useNavigate, useNavigation } from "react-router-dom";
import Header from "./components/header";
import { getAccount, getFixUserDataFromUserData, isAuthenticated, setConfigUser, setFullAuth } from "./api";
import { useConfig } from "./components/configContext";
import { useEffect, useState } from "react";
import Login from "./routes/login";
import CoolSpinner from "./components/coolSpinner";
import Spinner from "./components/spinner";


function BaseAppContext() {

  return <Outlet />
}

function App() {
  const configState = useConfig()
  const [config, setConfig] = configState

  const [loadingAuth, setLoading] = useState(isAuthenticated())
  useEffect(() => {
    async function getAndSetUser() {
      const response = await getAccount(null, { validateContext: { configState: configState } })
      if (response.succeeded) {
        setFullAuth({ userData: response.data, configState: configState,  })
      }
      setLoading(false)
    }
    isAuthenticated() && getAndSetUser()
  }, [])

  const { pathname, } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
      if (!config.user.is_authenticated && (pathname==="/login" || pathname==="/login/")) {
        navigate("/")
      }
  }, [pathname])

  const { state } = useNavigation()
  
  const loading = loadingAuth || state === "loading"

  return <Box height="100%" bgcolor="background.default">
  {loading && <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", bgcolor: "transparent", zIndex: "1200", }}>
    <Box sx={{ width: "6rem", height: "6rem" }}>
      <Spinner />
    </Box>
  </Box>}
  <Box height="100%" sx={{ filter: loading ? "blur(10px)" : undefined }}>
    <Header />
    {(!loading && (config.user.is_authenticated ? <Outlet /> : <Login />))}
  </Box>
</Box>
}

export default App
export { BaseAppContext }