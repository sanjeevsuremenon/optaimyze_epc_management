import React from 'react'

function Switch ({setTheme, theme}) {
  return (
    <div>
        <label htmlFor={`react-switch-new`} className='flex items-center justify-between w-8 h-4 bg-gray-500  rounded-3xl relative transition cursor-pointer peer'>
        <input type="checkbox" name="switch" id={`react-switch-new`} className='hidden h-0 w-0 peer' onClick={() => setTheme(theme == "dark" ? "light" : "dark")}/>
        
        <span className='content-none absolute top-0.5 left-0.5 w-4 h-3 rounded-3xl transition bg-green-100 shadow-md peer-checked:bg-red-500 peer-checked:translate-x-full'></span>
        </label>
    </div>
  )
}

export default Switch