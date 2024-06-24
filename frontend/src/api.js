import axios from "axios"

// const backendDomain = "https://api.mail.mintyhint.com"
const backendDomain = "http://192.168.1.107:8000"

const api = axios.create({
    baseURL: backendDomain,
})

api.interceptors.request.use((config) => {
    const token = getToken()
    if (Boolean(token)) {
        config.headers["Authorization"] = `Token ${token}`
    }
    return config
})

import { actionFromApi, createQuickAPIFunction, loaderFromApi } from "./api-utils"
import { getDefaultConfig, useConfig } from "./components/configContext"

const quickAPIFunction = createQuickAPIFunction(api, { sleepFor: 0, validate: (response, validateContext) => {
    if (!response.succeeded && response.error.errorMessage === "Invalid token." && response.extraInfo.serverOnline) {
        const configState = validateContext?.configState
        if (configState) {
            logout({ configState: configState })
        } else {
            setToken(null)
        }    
    }
    return response 
} })

function isAuthenticated() {
    return Boolean(getToken())
}

function getToken() {
    return localStorage.getItem("token") || null
}

function setToken(token) {
    if (Boolean(token)) {
        localStorage.setItem("token", token)
    } else {
        localStorage.removeItem("token")
    }
}

function getFixUserDataFromUserData(userData) {
    return {
        username: userData.username,
        token: userData.token,
        is_authenticated: Boolean(userData.token),
    }
}


function setConfigUser({ userData, configState }) {
    configState[1](oldConfig => ({ ...oldConfig, user: { ...oldConfig.user, ...getFixUserDataFromUserData(userData) } }))
}

function setFullAuth({ userData, configState }) {
    setToken(userData.token)
    setConfigUser({ userData, configState })
}

function logout({ configState }) {
    setFullAuth({ userData: getDefaultConfig(true).user, configState: configState })
}

export { isAuthenticated, getToken, getFixUserDataFromUserData, setConfigUser, setFullAuth, logout }



const getAccount = quickAPIFunction({method: "get", link: "/api/accounts/get/", })

const loginAPI = quickAPIFunction({method: "post", link: "/api/accounts/login/", })
const loginAndSaveToken = async (formData) => {
    const response = await loginAPI(formData)
    if (response.succeeded) {
        const userData = response.data
        setToken(userData.token)
    }
    return response
}
const loginAction = actionFromApi({ apiFunction: loginAndSaveToken })
export { getAccount, loginAction, }



const postDomain = quickAPIFunction({method: "post", link: "/api/mail/domain/", })
const postDomainAction = actionFromApi({ apiFunction: postDomain })
const getAllDomains = quickAPIFunction({method: "get", link: "/api/mail/domain/", })
const getAllDomainsLoader = loaderFromApi({apiFunction: async ({ searchParams }) => {
    return await getAllDomains(undefined, { params: searchParams }) }
})
export { postDomainAction, getAllDomainsLoader }