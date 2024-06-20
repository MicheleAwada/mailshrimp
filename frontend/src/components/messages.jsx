import { SnackbarProvider, SnackbarContent, closeSnackbar } from 'notistack'

import { forwardRef } from 'react'

import Alert from "@mui/material/Alert"


const AlertMUI = forwardRef((props, ref) => {
	const {
	  id,
	  severity,
	  message,
	  variant,
	  ...other
	} = props
	
	return (
	  <SnackbarContent ref={ref} role="alert" id={id}>
		<Alert severity={variant} variant='standard' onClose={() => closeSnackbar(id)}>
			{message}
		</Alert>
	  </SnackbarContent>
	)
  })


  export function MessagesProvider({ children }) {
	return <SnackbarProvider maxSnack={5} variant='success' hideIconVariant Components={{
			success: AlertMUI,
			warning: AlertMUI,
			error: AlertMUI,
			info: AlertMUI,
		}}>
		{children}
	</SnackbarProvider>
  }