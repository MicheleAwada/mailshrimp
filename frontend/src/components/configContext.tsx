import { createContext, useContext, useEffect, useState } from "react"
import { getToken, isAuthenticated } from "../api"

type SetStateFunction<S> = (prevState: S | ((prevState: S) => S)) => void;

type ConfigContextType = {
    user: {
        token: string | null,
        is_authenticated: boolean,
        username: string | null,
    }
}

type ConfigContextStateType = [ConfigContextType, SetStateFunction<ConfigContextType>];

function getDefaultConfig(ultraBase=false) {
    const defaultConfigContext: ConfigContextType = {
        user: {
            token: ultraBase ? null : getToken(),
            is_authenticated: ultraBase ? false : isAuthenticated(),
            username: null,
        },
    }
    return defaultConfigContext
}
export { getDefaultConfig }
const defaultConfigContext = getDefaultConfig()

const configContext = createContext([defaultConfigContext, () => { }])

function ConfigProvider({ children }: { children: React.ReactNode }) {
    const configState: ConfigContextStateType = useState(defaultConfigContext)


    return <configContext.Provider value={configState}>
        {children}
    </configContext.Provider>
}

const useConfig = () => useContext(configContext)

export { ConfigProvider }
export { useConfig }