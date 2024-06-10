import { Box, Tab, Tabs } from "@mui/material"
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

function MailConfigRoot() {
  const valueUrlMapping = { 0: "domain", 1: "mailbox", 2: "alias" };
  const urlValueMapping = { "domain": 0, "mailbox": 1, "alias": 2 };
  const { pathname } = useLocation()
  const all_paths = pathname.split("/").filter(Boolean)
  const last_path = all_paths[all_paths.length - 1]
  const [value, setValue] = useState(urlValueMapping[last_path] || 0)

  const navigate = useNavigate()
  
  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(`/config/mail/${valueUrlMapping[newValue]}`)
  };


  
  return <Box sx={{ height: "100%", p: 4, boxSizing: "border-box" }}>
    <Tabs value={value} onChange={handleChange} aria-label="mail configuration links">
      <Tab value={0} label="Domains" />
      <Tab value={1} label="Mailboxes" />
      <Tab value={2} label="Alias" />
    </Tabs>
    <Outlet />
  </Box>
}

export default MailConfigRoot