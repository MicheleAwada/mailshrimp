import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect } from "react"
import { useLocation } from "react-router-dom"


function jsxRawTransformer (component: any): string {
    // Check if the component is valid
    if (!component || !component.props || !component.props.children) {
      return ''; // Return an empty string if the component is invalid
    }
  
    // If the component has text content, return it
    if (typeof component.props.children === 'string') {
      return component.props.children;
    }
  
    // If the component has nested children, recursively extract text
    if (Array.isArray(component.props.children)) {
      return component.props.children.map((child: any) => jsxRawTransformer(child)).join('');
    }
  
    // If the component is a link, extract its text content
    if (component.type && component.type.displayName === 'Link') {
      return component.props.children;
    }
  
    // If the component has other types of children, return an empty string
    return '';
  }

function searchQA(fullFAQListOfDicts: [ string, string ][], searchTerm: string) {
    searchTerm = searchTerm.toLowerCase()
    const filteredIndexs: any = []
    fullFAQListOfDicts.forEach((qaList, index) => {
        const question = qaList[0]
        const anwser = qaList[1]
        if (question.includes(searchTerm) || anwser.includes(searchTerm)) {
            filteredIndexs.push(index)
        }
    })
    return filteredIndexs

}
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function capatilize(str: string) {
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


export { sleep, capatilize, searchQA, scrollToTop, scrollToComponent, jsxRawTransformer, wrapModulo, isMobile }