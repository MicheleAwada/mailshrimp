import Box from "@mui/material/Box";
import './App.scss'

import { Outlet } from "react-router-dom";
import Header from "./components/header";


function App() {
  return <Box height="100%" bgcolor="background.default">
    <Header />
    <Outlet />
  </Box>
}

export default App