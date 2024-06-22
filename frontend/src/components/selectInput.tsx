import { FormControl, InputLabel, Select } from "@mui/material";

import { generateUniqueId } from "../utils";
import React from "react";

function SimpleSelect({ label="", formControlProps={}, inputLabelProps={}, inputProps={}, children }: {
    formControlProps?: any,
    inputLabelProps?: any,
    inputProps?: any,
    label?: string,
    children?: any
}) {
    const randomId = 'generateUniqueId("simple-select-input")'

    return <FormControl sx={{ width: "12rem" }} {...formControlProps}>
        <InputLabel id={randomId} {...inputLabelProps}>{label}</InputLabel>
        <Select
            labelId={randomId}
            size="medium"
            autoComplete="off"
            label={label}
            {...inputProps}
        >
            {children}
        </Select>
    </FormControl>
}

export default SimpleSelect