import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { createTheme, ThemeProvider } from '@mui/material'
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'


import Index from './routes/index.jsx'
import Login from './routes/login.jsx'
import { loginAction } from './api.js'

const route = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<App />}>
    <Route index element={<Index />} />
    <Route path="login" element={<Login />} action={loginAction} />
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



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={route} />
    </ThemeProvider>
  </React.StrictMode>,
)
