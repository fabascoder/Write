import React from "react";

export const GlobalContext = React.createContext(); 

const teste = "Heloo Word"

export const GlobalStorage = ({children}) => {
    return <GlobalContext.Provider value={{teste}}>{children}</GlobalContext.Provider>
}   