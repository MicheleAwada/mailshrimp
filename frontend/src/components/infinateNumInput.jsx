import { Box, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField } from "@mui/material"
import { useEffect, useState } from "react";

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { generateUniqueId, isNumber, miniStateFromState } from "../utils"
import { useGetFromName } from "../api-utils";
import SimpleSelect from "./selectInput";

function SizeTypeSelectInput({ isInfinate, formControlProps={}, inputLabelProps={}, inputProps={}, }) {
    const randomId = generateUniqueId("size-type-select-input")
    return <SimpleSelect label="Size Type" formControlProps={formControlProps} inputLabelProps={inputLabelProps} inputProps={inputProps}>
        <MenuItem value={1}>KB</MenuItem>
        <MenuItem value={2}>MB</MenuItem>
        <MenuItem value={3}>GB</MenuItem>
        <MenuItem value={4}>TB</MenuItem>
    </SimpleSelect>
    // return <FormControl disabled={isInfinate} sx={{ width: "10rem" }} {...formControlProps}>
    //     <InputLabel id={randomId} {...inputLabelProps}>Size Type</InputLabel>
    //     <Select
    //         labelId={randomId}
    //         label="Size Type"
    //         size="medium"
    //         tabIndex={undefined}
    //         autoComplete="off"
    //         {...inputProps}
    //     >
    //     </Select>
    // </FormControl>
}

function InfinateNumInput({ name, fieldState: mainFieldState, getFromName: mainGetFromName, InputProps, showSizeType=true, selectProps: { inputSelectProps={}, ...selectProps }={}, ...props }) {
    const quotaInfinateName = `is_infinate`
    const quotaSizeName = `size`
    const quotaSizeTypeName = `size_type`

    
    const [mainFields, setMainFields] = mainFieldState

    const [fields, setFields] = useState({ [quotaInfinateName]: false, [quotaSizeName]: 0, [quotaSizeTypeName]: 3, })
    const { getFromName, } = useGetFromName({ fieldState: [fields, setFields], getFromNameOptions: { useFieldState: true, } })
    const quotaSizeTypeProps = getFromName(quotaSizeTypeName, { name: undefined, showHelperText: false, })
    const quotaSizeType = quotaSizeTypeProps.value
    const quotaSizeProps = getFromName(quotaSizeName, {
        onChangeValidate: (fieldValue, oldFieldValue) => {
            if (!isNumber(fieldValue)) {
                return oldFieldValue
            }
            return fieldValue
        },
        name: undefined,
        errorKeyName: name,
    })
    const quotaSize = quotaSizeProps.value
    const isInfinate = fields[quotaInfinateName]
    

    const handleClickIsInfinate = () => {
        setFields((oldFields) => ({ ...oldFields, [quotaInfinateName]: !isInfinate }))
    }
    const handleMouseDownIsInfinate = (event) => {
        event.preventDefault();
    }
    
    
    useEffect(() => {
        fixValue()
    }, [quotaSizeType])
    useEffect(() => {
        fixMainValue()
    }, [quotaSize, quotaSizeType, isInfinate])

    function fixMainValue() {
        const value =  getFixValue()
        setMainFields(oldFields => ({ ...oldFields, [name]: value.toString() }))
    }


    function fixValue() {
        if (showSizeType) {
            setFields(oldFields => ({ ...oldFields, [quotaSizeName]: getFixValue() }))
        }
    }
    function getFixValue() {
        if (showSizeType) {
            const maxBytes = 214*(1000**4) // 214 tb
            const sizeInKb = getValue() * 100
            const sizeInBytes = sizeInKb * 1000
            const minedSizeInBytes = Math.min(maxBytes, sizeInBytes)
            const sizeInSelectedSize = minedSizeInBytes / (1000**quotaSizeType)
            return sizeInSelectedSize
        } else {
            return getValue()
        }
    }

    function getValue() {
        // quota size in 100kbs so we divide by 1000 to get kb
        if (showSizeType) {
            const bytesSize = (quotaSize)*(1000**quotaSizeType)
            const hundredKiloBytesSize = Math.floor(bytesSize/1000/100)
            const finalSize = isInfinate ? -1 : hundredKiloBytesSize
            return finalSize
        } else {
            const finalValue = isInfinate ? -1 : quotaSize
            return finalValue
        }
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "start", alignItems: "center", gap: 1 }}>
            <input type="hidden" {...mainGetFromName(name, { hidden: true, })} />
            <TextField
                disabled={isInfinate}
                required={!isInfinate}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Box sx={{
                                pr: "0",
                                boxSizing: "border-box",
                                borderRadius: "100vmax",
                                bgcolor: isInfinate ? "rgba(91, 229, 220, 0.5)" : "transparent",
                                width: "2.5rem",
                                height: "2.5rem",
                            }}>
                                <IconButton
                                    aria-label="Infinate"
                                    onClick={handleClickIsInfinate}
                                    onMouseDown={handleMouseDownIsInfinate}
                                    edge="end"
                                    tabIndex={undefined}
                                    sx={{ width: "100%", height: "100%" }}
                                >
                                        <AllInclusiveIcon  />
                                </IconButton>
                            </Box>
                        </InputAdornment>
                    ),
                    ...InputProps,
                }}
                {...quotaSizeProps}
                autoComplete="off"
                onBlur={fixValue}
                tabIndex={undefined}
                {...props}
            />
            {showSizeType && <SizeTypeSelectInput name={quotaSizeTypeName} isInfinate={isInfinate} inputProps={{ ...quotaSizeTypeProps, ...inputSelectProps }}  {...selectProps} />}
        </Box>
    )
}

export default InfinateNumInput