import { sleep, isServerOfflineFromStatusCode } from "./utils";

type allStringArrayAndNotEmpty = string[] & { length: number } & { 0: string }
type fieldAllStringArrayAndNotEmpty = { [key: string]: string[] | string }

function findError(error: { message: string, response?: { status: number, statusText: string, data?: fieldAllStringArrayAndNotEmpty } }) {
	let fields: fieldAllStringArrayAndNotEmpty = {};
	let errorMessage: undefined | string = undefined;
	let alwaysErrorMessage = "Oops, a unknown error occured";
	if (error.message) {
		alwaysErrorMessage = error.message;
		errorMessage = error.message;
	}
	if (error.response && error.response.data) {
        const potientiallyFields = error.response.data
        const fieldsErrorExists = Object.keys(potientiallyFields).some((potientialField) => {
            const value = potientiallyFields[potientialField]
            return Array.isArray(value)
        })
        if (fieldsErrorExists) {
            fields = potientiallyFields;
			alwaysErrorMessage = "Oops, check to see a field has a error to fix it";
            errorMessage = undefined
            if (fields.non_field_errors && Array.isArray(error.response.data.non_field_errors)) {
                const formattedNonFieldError = formatError(error.response.data.non_field_errors) || ""
                if (formattedNonFieldError) {
                    errorMessage = formattedNonFieldError
                    alwaysErrorMessage = errorMessage
                }
            } else if (Object.keys(fields).length === 0) {
                const statusText = error.response?.statusText || ""
                const axiosMessage = error.message || ""
                errorMessage = statusText || axiosMessage || "Oops, their was an error."
                alwaysErrorMessage = errorMessage
            }
        } else if (error.response.data.detail && typeof error.response.data.detail === "string") {
			alwaysErrorMessage = error.response.data.detail;
            errorMessage = alwaysErrorMessage
		} else if (error.response.data.status && typeof error.response.data.status === "string") {
			alwaysErrorMessage = error.response.data.status;
            errorMessage = alwaysErrorMessage
		}
	}
	return { errorMessage: errorMessage, alwaysErrorMessage: alwaysErrorMessage, fields: fields, };
}

function getExtraInfoFromResponse(response: { [key: string]: any }) {
    return { serverOnline: !isServerOfflineFromStatusCode(response.status), statusCode: response.status, statusText: response.statusText };
}


type dataType = {[key: string]: any} | null | undefined

interface fetchAPIInterface {
	link?: string
	link_data?: any
	link_function?: (data: any) => string
	sleepFor?: number
	data?: dataType
	method?: "post" | "get" | "put" | "patch" | "delete"
    validate?: (d: any, c: any) => {}
    validateContext?: any
    params?: { [key: string]: string }
}

async function fetchAPI(api: any, { data={}, params={}, link, link_function, link_data, validate=d=>d, validateContext={}, sleepFor=0, method="post"}: fetchAPIInterface = {}) {
    if (sleepFor) {
        await sleep(sleepFor)
    }
    if (link_function && link_data && !link) {
        link = link_function(link_data)
    }
    if (params) {
        const params_string = new URLSearchParams(params).toString()
        if (params_string.length > 0) {
            link = `${link}?${params_string}`
        }
    }
    try {
		let response: any;
        response = await api[method](link, data)
        return validate({ succeeded: true, extraInfo: getExtraInfoFromResponse(response), response: response, data: response.data }, validateContext)
    } catch (e: any) {
        return validate({ succeeded: false, extraInfo: getExtraInfoFromResponse(e.response), error: findError(e) }, validateContext)
    }
}

function getFetchAPIFunction(api: any, baseFetchAPIProps: fetchAPIInterface = {}) {
    return async (data?: dataType, fetchProps: fetchAPIInterface={}) => {
        return await fetchAPI(api, { data, ...baseFetchAPIProps, ...fetchProps })
    }
}

function createQuickAPIFunction(api: any, baseFetchAPIProps: fetchAPIInterface = {}) {
	const quickAPIFunction = (args: fetchAPIInterface={}) => getFetchAPIFunction(api, { ...baseFetchAPIProps, ...args})
	return quickAPIFunction
}

function actionFromApi({ apiFunction, requiresFormData=true }: { requiresFormData: boolean, apiFunction: (formData?: any) => any }) {
    return async function ({ request, context }: { context: any, request: any }) {
        let response: any;
        if (requiresFormData) {
            const formData = await request.formData();
            response = await apiFunction(formData)
        } else {
            response = await apiFunction()
        }
        return response
    }
}
function loaderFromApi({ apiFunction, throwError = false }: { throwError: boolean, apiFunction: (formData?: any) => any }) {
    return async function (allProps: { params: any, context: any, request: any }) {
        const urlFromRequest = allProps.request.url
        const paramsFromUrl = new URL(urlFromRequest).searchParams
        const paramsDict = Object.fromEntries(paramsFromUrl.entries())
        const response = await apiFunction({ searchParams: paramsDict, ...allProps })
        if (!response.succeeded && throwError) {
            throw new Error(response?.errorMessage)
        }
        return response.data
    }
}

export { fetchAPI, getFetchAPIFunction, createQuickAPIFunction, findError, actionFromApi, loaderFromApi  }


import { useEffect, useState } from "react"
import { useFetcher, } from "react-router-dom"

import { capatilize } from "./utils";
import { enqueueSnackbar } from "notistack";

export type anyStateType = [any, React.Dispatch<React.SetStateAction<any>>]

type errorArrayType = string[]

function formatError(errorArray: errorArrayType) {
    if (!Array.isArray(errorArray) || errorArray.length === 0) {
      return null;
    }
    let clonedErrorArray = [...errorArray];
    clonedErrorArray = clonedErrorArray.map((error, index) => {
      let new_error = error
      if (new_error.charAt(new_error.length - 1)===".") {
        new_error = new_error.slice(0, -1)
      }
      if (index === clonedErrorArray.length - 1) {
        new_error += "."
      }
      return new_error
    })
    const lastElement = clonedErrorArray.pop();
  
    if (clonedErrorArray.length > 0) {
      return clonedErrorArray.join(", ") + ", and " + lastElement;
    } else {
      return lastElement;
    }
  }


interface NestedError {
    [key: string]: NestedError | NestedError[] | errorArrayType | string
}

function getFullError(error: NestedError, itemLocation: string) {
    const keys = itemLocation.split(/\]\[|\[|\]/).filter(Boolean);
    let isError = false;
    let currentError: any = error;
    if (!currentError) {
        return {error: null, isError: isError};
    }
    for (const key of keys) {
      if (currentError[key] === undefined) {
        return {error: null, isError: isError}; // Item doesnt exist
      }
      currentError = currentError[key];
    }
    if (!Array.isArray(currentError)) {
        return {error: currentError, isError: isError};
    }
    isError = true;
    
    let stringError = formatError(currentError)
    return {error: stringError, isError: isError};
}




function baseReactRouterDataUseEffect({ data, onSuccess=(data: any) => {}, onError=(data: any) => {} }: { data: any, onSuccess: (data: any) => void, onError: (data: any) => void }) {
    useEffect(() => {
        if (data) {            
            if (data.succeeded) {
                onSuccess(data)
            } else {
                onError(data)
            }
        }
    }, [data])
}

interface onSucessOrError {
    data: any
    errorState: anyStateType
    message?: string
}

const baseUseDataAndErrorOnSuccess = ({ data, errorState, message = "Woohoo, successful" }: onSucessOrError) => {
    enqueueSnackbar(message, {variant: "success"})
    const setError = errorState[1]
    setError({})
}
const baseUseDataAndErrorOnError = ({ data, errorState, message = data.error.alwaysErrorMessage }: onSucessOrError) => {
    enqueueSnackbar(message, {variant: "error"})
    const setError = errorState[1]
    setError(data.error)
}


type fetcherType = ReturnType<typeof useFetcher>
// type fetcherType = Fetcher
interface useFetcherAndErrorProps {
    fetcher?: fetcherType
    overrideOriginalOnSuccess?: boolean
    overrideOriginalOnError?: boolean
    onError?: (props: { data: any, errorState: any }) => void
    onSuccess?: (props: { data: any, errorState: any }) => void
    onSuccessMessage?: string
    onErrorMessage?: string
}

function useFetcherAndError ({ fetcher=useFetcher(), overrideOriginalOnSuccess=false, overrideOriginalOnError=false,  onError=() => {}, onSuccess=() => {}, onSuccessMessage, onErrorMessage  }: useFetcherAndErrorProps = {})
// : { fetcher: fetcherType, errorState: anyStateType, loading: Boolean }
{
    const errorState: anyStateType = useState({})
    const fullOnSuccess = (data: any) => {
        const originalFunctionProps: onSucessOrError = { data, errorState }
        const props = {...originalFunctionProps}
        if (onSuccessMessage) {originalFunctionProps["message"] = onSuccessMessage}
        !overrideOriginalOnSuccess && baseUseDataAndErrorOnSuccess(originalFunctionProps)
        onSuccess(props)
    }
    const fullOnError = (data: any) => {
        const originalFunctionProps: onSucessOrError = { data, errorState }
        const props = {...originalFunctionProps}
        if (onErrorMessage) {originalFunctionProps["message"] = onErrorMessage}
        !overrideOriginalOnError && baseUseDataAndErrorOnError(originalFunctionProps)
        onError(props)
    }
    baseReactRouterDataUseEffect({  data: fetcher?.data, onError: fullOnError, onSuccess: fullOnSuccess })

    return { fetcher: fetcher, errorState: errorState, loading: (fetcher.state==="submitting") }
}

interface useFullFetcherActionInterface {
    useFetcherAndErrorProps?: useFetcherAndErrorProps
    useGetFromNameProps?: useGetFromNameInterface
}

function useFullFetcherAction({ useFetcherAndErrorProps={}, useGetFromNameProps={} }: useFullFetcherActionInterface = {}) {
    const { fetcher, errorState, loading } = useFetcherAndError(useFetcherAndErrorProps)
    const { getFromName, fieldState } = useGetFromName({ errorState, ...useGetFromNameProps })
    return { loading, fetcher, getFromName, fieldState, errorState }
}

interface useGetFromNameInterface {
    errorState?: anyStateType
    fieldState?: anyStateType
    getFromNameOptions?: getFromNameOptionsInterface
}

function useGetFromName({ errorState=useState({}), getFromNameOptions={}, fieldState=(getFromNameOptions.useFieldState ? useState({}) : undefined) }: useGetFromNameInterface = {}) {
    const [error] = errorState
    const quickGetFromName = (basename: string, options: getFromNameOptionsInterface={}) => getFromName(basename, error, { fieldState, ...getFromNameOptions, ...options} )
    return { getFromName: quickGetFromName, errorState, fieldState }
}


interface getFromNameOptionsInterface {
    fieldState?: any;
    useFieldState?: boolean;
    hidden?: boolean;
    onChange?: (...args: any) => any;
    errorKeyName?: string;
    errorKey?: string;
    errorExistsKey?: string;
    name?: string;
    fieldsKeyName?: string
    helperText?: string;
    showHelperText?: boolean
    addLabel?: boolean
    labelName?: string
    overrideOriginalOnChange?: boolean
    onChangeValidate?: (fieldValue:any, oldFieldValue: any) => any
    defaultValue?: any
}

function getFromName(basename: string, error: any, {
    fieldState = undefined,
    useFieldState = false,
    hidden = false,
    onChange = () => {},
    errorKeyName = basename,
    errorKey = "helperText",
    errorExistsKey = "error",
    name=basename,
    fieldsKeyName = basename,
    helperText,
    showHelperText=true,
    overrideOriginalOnChange = false,
    addLabel=true,
    labelName = capatilize(basename),
    onChangeValidate = (fieldValue) => fieldValue,
    defaultValue = undefined,
}: getFromNameOptionsInterface = {}) {
    let finalReturn: {[key: string]: any} = { name: name,  };


    const [fields, setFields]: any = (fieldState || [undefined, undefined]);
    const fieldValue = fields?.[fieldsKeyName];
    finalReturn["value"] = fieldValue
    // if (defaultValue!==undefined) {
    //     if (fieldValue===undefined) {
    //         finalReturn["value"] = defaultValue
    //     }
    //     console.log("setField Default")
    //     useEffect(() => {
    //         if (fieldValue===undefined) {
    //             setFields((oldField:any) => ({ ...oldField, [fieldsKeyName]: defaultValue }));
    //         }
    //     }, [])
    // }
    if (hidden) { return finalReturn }
    function defaultOnChange(e: any) {
        setFields((oldField:any) => ({ ...oldField, [fieldsKeyName]: onChangeValidate(e.target.value, oldField?.[fieldsKeyName]) }))
    }
    function baseOnChange(e: any) {
        !overrideOriginalOnChange && defaultOnChange(e)
        onChange(e, fieldState)
    }
    const { error: fieldError, isError } = getFullError(error.fields, errorKeyName);
    finalReturn[errorExistsKey] = isError
    if (showHelperText) {
        finalReturn[errorKey] = fieldError
        if (helperText && !isError) { finalReturn[errorKey] = helperText }
    }
    if (useFieldState) {finalReturn["onChange"] = baseOnChange}
    if (addLabel) {finalReturn["label"] = labelName}

    return finalReturn
}





export { useFetcherAndError,
    getFromName, useGetFromName,
    useFullFetcherAction,
}