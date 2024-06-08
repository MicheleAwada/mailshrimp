import Box from "@mui/material/Box";
import { Button, Collapse, Dialog, IconButton, MenuItem, Modal, Pagination, Paper, Select, Stack, TextField, Typography } from "@mui/material"
import { useFullFetcherAction, useGetFromName } from "../../api-utils.ts"
import InfinateNumInput from "../../components/infinateNumInput";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Spinner from "../../components/spinner.jsx"
import { useEffect, useState } from "react";
import { useLoaderData, useParams, useSearchParams } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit"
import CreateIcon from "@mui/icons-material/Create"
import SimpleSelect from "../../components/selectInput.tsx";


function DomainCreateForm({ modalState: [open,setOpen] }) {
  const fieldState = useState({
    "name": "",
    "quota": 0,
    "max_mailbox_quota": 0,
    "max_mailboxes": 0,
    "max_aliases": 0,
    "dkim_selector": "mail",
    "dkim_key_size": 2048,

  })
  const [fields, setFields] = fieldState
  const { getFromName, fetcher, loading } = useFullFetcherAction({
    useGetFromNameProps: {
      getFromNameOptions: {
        useFieldState: true,
      },
      fieldState: fieldState
    }
  })
  
  // useEffect(() => {console.log("fields");console.log(fields)}, [fields])


  const [showMoreInfo, setShowMoreInfo] = useState()

  return <Paper height="100%">
    <Box sx={{ height: "100%", p: 4, boxSizing: "border-box" }}>
      <fetcher.Form method="POST">
        <Stack spacing={2}>
          <Box>
            <TextField {...getFromName("name", { labelName: "Domain Name", })} required />
          </Box>
          <InfinateNumInput showSizeType={true} name="quota" label="Quota" fieldState={fieldState} getFromName={getFromName} />
          <InfinateNumInput showSizeType={true} name="max_mailbox_quota" label="Maxium MailBoxes Quota" fieldState={fieldState} getFromName={getFromName} />
          <InfinateNumInput showSizeType={false} name="max_mailboxes" label="Max MailBoxes" fieldState={fieldState} getFromName={getFromName} />
          <InfinateNumInput showSizeType={false} name="max_aliases" label="Max Aliases" fieldState={fieldState} getFromName={getFromName} />
          <Paper variant="outlined">
            <Box component="button" type="button" onClick={() => (setShowMoreInfo(!showMoreInfo))} sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.01)" }, backgroundColor: "transparent", cursor: "pointer", display: "flex", justifyContent: "start", alignItems: "center", py: 1, px: 4, width: "100%", border: "none", }}>
              <Typography>Show Additional Info</Typography>
                <Box sx={{ ml: 2, color: "white" }}>
                  <ExpandMoreIcon sx={{ transform: `rotate(${showMoreInfo ? 180 : 0}deg)`, transition: "transform 0.3s", }} />
                </Box>
            </Box>
            <Collapse in={showMoreInfo}>
              <Box p={4} display="flex" alignItems="center" gap={4} flexWrap="wrap">
                <TextField {...getFromName("dkim_selector", { labelName: "DKIM Selector", })} />
                <TextField {...getFromName("dkim_key_size", { labelName: "DKIM Key Size", })} />
              </Box>
            </Collapse>
          </Paper>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button type="button" variant="outlined" onClick={() => setOpen(false)}>Back</Button>
            <Button type="submit" variant="contained" startIcon={loading && <Spinner />}>{!loading && "Submit"}</Button>
          </Box>
        </Stack>
      </fetcher.Form>
    </Box>
  </Paper>
}


function SelectOrNormalInput({ onChangeValidate=(v) => v, isSelectInputState=useState(true), valueState=useState(""), selectValuesAndLabels=[], showName=false, name="", label="", textFieldProps={}, simpleSelectProps: { simpleSelectInputProps, ...simpleSelectProps }={} }) {
  const [isSelectInput, setIsSelectInput] = isSelectInputState
  const [value, setValue] = valueState


  function onChangeTextField(e) {
    const fieldValue = e.target.value
    setValue(onChangeValidate(fieldValue, value, isSelectInput))
  }
  function onChangeSelectField(e) {
    const fieldValue = e.target.value
    setValue(onChangeValidate(fieldValue, value, isSelectInput))
  }

  return <>
    {showName && <input type="hidden" name={name} value={value} />}
    {isSelectInput
    ? <SimpleSelect label={label} inputProps={{ value, onChange: e => onChangeTextField(e, true), ...simpleSelectInputProps }} {...simpleSelectProps}>
        {selectValuesAndLabels.map(([value, name], index) => <MenuItem key={index} value={value}>{name}</MenuItem>)}
      <MenuItem onClick={(e) => setIsSelectInput(false)} value={1}>Other</MenuItem>
    </SimpleSelect>
    : <Box>
      <TextField InputProps={{
        endAdornment: <IconButton>
          
        </IconButton>
      }} label={label} value={value} {...textFieldProps} />
    </Box>}
  </>
}

function MailConfigDomain() {
  const domainsData = useLoaderData()
  const domains = domainsData.results
  const domainCount = domainsData.count
  const [createModalOpen, setCreateModalOpen] = useState(false)


  const [searchParams, setSearchParams] = useSearchParams()
  const serachParamsDict = Object.fromEntries(searchParams)


  const searchParamsPageSize = parseInt(searchParams.get("page_size")) || 25
  const pageSizeState = useState(searchParamsPageSize)
  const [pageSize, setPageSize] = pageSizeState
  const pagesCount = Math.ceil(domainCount / pageSize)


  const searchParamsPage = parseInt(searchParams.get("page")) || 1
  const [page, setPage] = useState(searchParamsPage)
  

  function paginationOnChange(_e, value) {
    setSearchParams({ ...serachParamsDict, page: value })
    setPage(value)
  }

  return <Box>
    <Box py={4} display="flex" justifyContent="space-between" alignItems="center">
      <Button variant="outlined" endIcon={<CreateIcon />} onClick={() => setCreateModalOpen(true)}>Create</Button>
      <Box display="flex" justifyContent="" alignItems="center" gap={4}>
        <Typography>{domainCount} domains</Typography>
        <SelectOrNormalInput
        onChangeValidate={(v, oldV, isSelectInput) => {
          if (isSelectInput && v===1) {
            return v
          }
          v = Math.max(1, v)
          v = Math.min(200, v)
          setSearchParams({ ...serachParamsDict, "page_size": v })
          return v
        }}
        valueState={pageSizeState}
        label="Page Size"
        selectValuesAndLabels={[
          [25,25],
          [50,50],
          [75,75],
          [100,100],
          [200,200],
        ]} />
      </Box>
    </Box>
    <Stack gap={2}>
      {domains.map((domain, index) => {
        return <Box key={domain.name} sx={{ p:4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)" }}>
          {domain.name}
        </Box>
      })}
    </Stack>
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12, px: 4 }}>
      <Pagination count={pagesCount} onChange={paginationOnChange} page={searchParamsPage} />
    </Box>
    {
      <Dialog open={createModalOpen}><DomainCreateForm modalState={[createModalOpen, setCreateModalOpen]} /></Dialog>
    }
  </Box>
}


export default MailConfigDomain