import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

function sleep(ms: number) {
    return new Promise((resolve: any) => setTimeout(resolve, ms));
}

function capatilize(str: string) {
  if (typeof str !== "string") { return undefined }
  str = str.slice().toLowerCase()
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function scrollToTop(onScrollToTop=() => {window.scrollTo(0, 0)}) {
  // Extracts pathname property(key) from an object
  const { pathname } = useLocation();

  // Automatically scrolls to top whenever pathname changes
  useEffect(() => {
    onScrollToTop()
  }, [pathname]);
}

function scrollToComponent(element: HTMLElement, gapHeight: number=0) {
  window.scrollTo({top: element.offsetTop - gapHeight, behavior: 'smooth'});
}

function wrapModulo(x: number, n: number) {
  return ((x % n) + n) % n;
}

function isMobile(considerXs: boolean=true) {
  const headerStuff = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent);
  if (!considerXs) {return headerStuff}
  const isXs = useMediaQuery((theme: any) => theme.breakpoints.down("sm"))
  return isXs || headerStuff
}

function miniStateFromState(state: any, mykey: string, defaultValue: any) {
  const [stateValue, setState] = state;
  let valueOfMiniState = stateValue[mykey];
  if (defaultValue) {
    if (valueOfMiniState === undefined) {
      valueOfMiniState = defaultValue;
    }
    useEffect(() => {
      if (valueOfMiniState === undefined) {
        setState((oldState: any) => {
          const newState = {...oldState};
          newState[mykey] = defaultValue;
          return newState;
        });
      }
    },[])
  }
  return [valueOfMiniState, (operation: any) => {
    if (typeof operation === "function") {
      operation = operation(valueOfMiniState);
    }
    setState((oldState: any) => {
      console.log("operation")
      console.log(operation)
      return { ...oldState, [mykey]: operation };
    });
  }];
}


function generateUniqueId(prefix: string="") {
  let id: any;
  do {
    id = `${prefix}-id-${Math.floor(Math.random() * 1000000)}`;
  } while (document.getElementById(id)); // Check if element with the ID already exists
  return id;
}
function isServerOfflineFromStatusCode(statusCode: number) {
  return statusCode >= 200 && statusCode < 400;
}
function isNumber(value: any) {
  return !isNaN(value)
}
export { generateUniqueId, isNumber, miniStateFromState }
// neccassary for api-utils
export { sleep, capatilize, isServerOfflineFromStatusCode, }