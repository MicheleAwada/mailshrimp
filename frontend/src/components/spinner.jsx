import SpinnerSVG from "../assets/components/spinner/spinner.svg?react"

import SVGIcon from "@mui/material/SvgIcon"

export default function Spinner({ color="inherit", sx={}, ...props }) {
    return (
            <SVGIcon component={SpinnerSVG} sx={{ color: color, width: "100%", height: "100%", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } }, animation: "spin 2s linear infinite", ...sx }} {...props} />
    )
}