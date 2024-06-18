import Box from "@mui/material/Box";
import { AppBar, Toolbar } from "@mui/material"

import Logo from "../assets/logo.svg"

import { Link as ReactRouterLink } from "react-router-dom"
import { useEffect, useRef, useState } from "react";

function Header() {
    const [headerHeight, setHeaderHeight] = useState(0)
    const headerRef = useRef()
    function getHeaderHeight() {
        if (!headerRef.current) {
            return 0
        }
        return headerRef.current.getBoundingClientRect().height
    }
    useEffect(() => {
        setHeaderHeight(getHeaderHeight())
    }, [])
    return (
        <>
            <AppBar>
                <Box ref={headerRef}>
                    <Toolbar>
                        <Box to="/" component={ReactRouterLink} sx={{ p: { xs: "6px" }, boxSizing: "border-box", width: "auto", height: { xs: "4rem", lg: "4rem"}, display: "flex", alignItems: "center" }}>
                            <Box sx={{ bgcolor: "white", p: 1, boxSizing: "border-box", borderRadius: "100vmax", width: '100%', height: '100%' }}>
                                <Box component="img" src={Logo} sx={{ width: "100%", height: "100%" }}></Box>
                            </Box>
                        </Box>
                    </Toolbar>
                </Box>
            </AppBar>
            <Box height={`${headerHeight}px`} />
        </>
    )
}

export default Header