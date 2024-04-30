import axios from "axios"

// const backendDomain = "https://api.mail.mintyhint.com"
const backendDomain = "http://127.0.0.1:8000"

const api = axios.create({
    baseURL: backendDomain,
})
import { actionFromApi, createQuickAPIFunction } from "./api-utils"

const quickAPIFunction = createQuickAPIFunction(api)

function isAuthenticated() {
    return Boolean(localStorage.getItem("token"))
}

function getToken() {
    return localStorage.getItem("token")
}

function setToken(token) {
    localStorage.setItem("token", token)
}

export { isAuthenticated, getToken, setToken }

const login = quickAPIFunction({method: "post", link: "/api/login/", })
const loginAction = actionFromApi({ apiFunction: login})
export { loginAction }