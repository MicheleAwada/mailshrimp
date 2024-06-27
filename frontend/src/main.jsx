import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { BaseAppContext } from './App.jsx'
import { createTheme, ThemeProvider } from '@mui/material'
import { Outlet, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'


import Index from './routes/index.jsx'
import Login from './routes/login.jsx'
import { getAllDomainsLoader, loginAction, postDomainAction } from './api.js'
import { ConfigProvider } from './components/configContext'
import MailConfigRoot from './routes/mailConfig/root.jsx'
import MailConfigDomain from './routes/mailConfig/domain.jsx'
import MailConfigMailBox from './routes/mailConfig/mailbox.jsx'
import MailConfigAlias from './routes/mailConfig/alias.jsx'

const route = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<BaseAppContext />}>
    <Route path="/" element={<App />}>
      <Route index element={<Index />} />
      <Route path="login" action={loginAction} />
      <Route path="config" element={<Outlet />}>
        <Route path="mail" element={<MailConfigRoot />}>
          <Route path="domain" action={postDomainAction} loader={getAllDomainsLoader} element={<MailConfigDomain />} />
          <Route path="mailbox" element={<MailConfigMailBox />} />
          <Route path="alias" element={<MailConfigAlias />} />
        </Route>
      </Route>
    </Route>
  </Route>
))



const themeOptions = {
  typography: {
    fontFamily: [
      'sans-serif',
      'Roboto',
    ].join(','),
    allVariants: {
      color: "white"
    }
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#e46363',
    },
    secondary: {
      main: '#afeeee',
    },
    text: {
      primary: 'rgba(255,255,255,0.87)',
      secondary: 'rgba(255,255,255,0.54)',
      disabled: 'rgba(255,255,255,0.38)',
      hint: 'rgba(255,255,255,0.38)',
    },
    background: {
      default: '#222222',
      paper: '#333333',
    },
  },
};

const theme = createTheme(themeOptions)

import { MessagesProvider } from "./components/messages";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ConfigProvider>
        <MessagesProvider>
          <RouterProvider router={route} />
        </MessagesProvider>
      </ConfigProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
