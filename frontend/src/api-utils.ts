import { sleep } from "./utils";

type allStringArrayAndNotEmpty = string[] & { length: number } & { 0: string }
type fieldAllStringArrayAndNotEmpty = { [key: string]: allStringArrayAndNotEmpty | string | undefined }

function findError(error: { message?: string, response?: { data?: fieldAllStringArrayAndNotEmpty } }) {
	let fields: fieldAllStringArrayAndNotEmpty = {};
	let errorMessage: undefined | string = undefined;
	let alwaysErrorMessage = "Oops, a unknown error occured";
	let type = "internal"
	if (error.message) {
		alwaysErrorMessage = error.message;
		errorMessage = error.message;
	}
	if (error.response && error.response.data) {
		type = "external"

        if (error.response.data.detail && typeof error.response.data.detail === "string") {
			alwaysErrorMessage = error.response.data.detail;
            errorMessage = alwaysErrorMessage
		} else if (error.response.data.status && typeof error.response.data.status === "string") {
			alwaysErrorMessage = error.response.data.status;
            errorMessage = alwaysErrorMessage
		} else {
			fields = error.response.data;
			alwaysErrorMessage = "Oops, check to see a field has a error to fix it";
            errorMessage = undefined
            if (fields.non_field_errors && Array.isArray(error.response.data.non_field_errors)) {
                const formattedNonFieldError = formatError(error.response.data.non_field_errors) || ""
                if (formattedNonFieldError) {
                    errorMessage = formattedNonFieldError
                    alwaysErrorMessage = errorMessage
                }
            }
		}
	}
	return { errorMessage: errorMessage, alwaysErrorMessage: alwaysErrorMessage, fields: fields, errorType: type };
}

type dataType = {[key: string]: any}

interface fetchAPIInterface {
	link?: string
	link_data?: any
	link_function?: (data: any) => string
	sleepFor?: number
	data?: dataType
	method?: "post" | "get" | "put" | "patch" | "delete"
}

async function fetchAPI(api: any, { data, link, link_function, link_data, sleepFor=0, method="post"}: fetchAPIInterface = {}) {
    if (sleepFor) {
        await sleep(sleepFor)
    }
    if (link_function && link_data && !link) {
        link = link_function(link_data)
    }
    try {
		let response: any;
        if (Boolean(data)) {
            response = await api[method](link, data)
        } else {
            response = await api[method](link)
        }
        return { succeeded: true, response: response, data: response.data }
    } catch (e) {
        return {succeeded: false, error: findError(e)}
    }
}

function getFetchAPIFunction(api: any, fetchAPIProps: fetchAPIInterface = {}) {
    return async (data?: dataType, link_data?: any) => {
        return await fetchAPI(api, {data, link_data, ...fetchAPIProps})
    }
}

function createQuickAPIFunction(api: any, fetchAPIProps: fetchAPIInterface = {}) {
	const quickAPIFunction = (args: fetchAPIInterface={}) => getFetchAPIFunction(api, { ...fetchAPIProps, ...args})
	return quickAPIFunction
}

function actionFromApi({ apiFunction, requiresFormData=true }: { requiresFormData: boolean, apiFunction: (formData?: any) => any }) {
    return async function ({ request }) {
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

export { fetchAPI, getFetchAPIFunction, createQuickAPIFunction, actionFromApi, findError,  }


import { useEffect, useState } from "react"
import { useFetcher, Fetcher } from "react-router-dom"

import { capatilize } from "./utils";

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


function miniStateFromState(state: any, key: string) {
    const [stateValue, setState] = state
    const valueOfMiniState = stateValue[key]
    return [valueOfMiniState, (operation: any) => {
        if (typeof operation === "function") {
            operation = operation(valueOfMiniState)
        }
        setState((oldState: {[key: string]: any}) => ({...oldState, [key]: operation}))
    }]
}

function baseReactRouterDataUseEffect({ data, onSuccess=(data: any) => {}, onError=(data: any) => {} }) {
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
const baseUseDataAndErrorOnSuccess = ({ data, errorState, message = "Woohoo, successful" }) => {
    const setError = errorState[1]
    setError({})
}
const baseUseDataAndErrorOnError = ({ data, errorState, message = data.errorMessage }) => {
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
        const originalFunctionProps = { data, errorState }
        const props = {...originalFunctionProps}
        if (onSuccessMessage) {originalFunctionProps["message"] = onSuccessMessage}
        !overrideOriginalOnSuccess && baseUseDataAndErrorOnSuccess(originalFunctionProps)
        onSuccess(props)
    }
    const fullOnError = (data: any) => {
        const originalFunctionProps = { data, errorState }
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
    disableFieldState?: boolean
    getFromNameOptions?: getFromNameOptionsInterface
}

function useGetFromName({ disableFieldState=false, errorState=useState({}), getFromNameOptions={disableFieldState}, fieldState=(disableFieldState ? undefined : useState({})) }: useGetFromNameInterface = {}) {
    const [error] = errorState
    const quickGetFromName = (name: string, options: getFromNameOptionsInterface={}) => getFromName(name, error, { fieldState, ...getFromNameOptions, ...options} )
    return { getFromName: quickGetFromName, errorState, fieldState}
}


interface getFromNameOptionsInterface {
    fieldState?: any;
    disableFieldState?: boolean;
    hidden?: boolean;
    onChange?: (...args: any) => any;
    errorKeyName?: string;
    errorKey?: string;
    errorExistsKey?: string;
    emptyNameIf?: (fieldState?: any) => boolean;
    helperText?: string;
    addLabel?: boolean
    labelName?: string
    overrideOriginalOnChange?: boolean
}

function getFromName(name: string, error: any, {
    fieldState,
    disableFieldState = false,
    hidden = false,
    onChange = () => {},
    errorKeyName = name,
    errorKey = "helperText",
    errorExistsKey = "error",
    emptyNameIf = () => false,
    helperText,
    overrideOriginalOnChange = false,
    addLabel=true,
    labelName = capatilize(name.slice())
}: getFromNameOptionsInterface = {}) {

    let finalReturn = { name: emptyNameIf(fieldState) ? undefined : name,  };
    if (!disableFieldState) { 
        const [fields, setFields]: any = fieldState;
        finalReturn["value"] = fields[name] || ""
    }
    if (hidden) { return finalReturn }
    const { error: fullError, isError } = getFullError(error.fields, errorKeyName);
    finalReturn = {...finalReturn, [errorKey]: fullError, [errorExistsKey]: isError }
    if (helperText && !fullError && !isError) { finalReturn[errorKey] = helperText }
    if (!disableFieldState) {
        const [fields, setFields]: any = fieldState;
        function baseOnChange(e: any) {
            !overrideOriginalOnChange && setFields((oldField:any) => ({ ...oldField, [name]: e.target.value }));
            onChange(e, fieldState)
        }
        finalReturn["onChange"] = baseOnChange
    }
    if (addLabel) {
        finalReturn["label"] = labelName
    }

    return finalReturn
}


function searchQA(fullFAQListOfDicts: [ string, string ][], searchTerm: string) {
    searchTerm = searchTerm.slice().toLowerCase()
    return fullFAQListOfDicts.filter((qaList, index) => {
        const question = qaList[0].slice().toLowerCase()
        const anwser = qaList[1].slice().toLowerCase()
        if (question.includes(searchTerm) || anwser.includes(searchTerm)) {
            return true
        }
        return false
    })

}




export { miniStateFromState,
    useFetcherAndError,
    getFromName, useGetFromName,
    useFullFetcherAction,
    searchQA
}