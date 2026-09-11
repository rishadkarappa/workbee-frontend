// password regex
export const passwordRegex = {
    capitalLetter : /(?=.*[A-Z])/,
    specialSymbol: /(?=.*[@$!%*?&])/,
    sizDigit : /^.{6,}$/
}

// email regex
export const emailRegex = {
    validEmail : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

// name regex
export const nameRegex = {
    validName :  /^[A-Za-z]+$/,
}

// work title
export const workRegex = {
  title: /^.{3,}$/,
}

// text validation
export const textRegex = {
  minTwoChars: /^.{2,}$/,
  minFiveChars: /^.{5,}$/,
}

// numbers only
export const numberRegex = /^\d+(\.\d+)?$/