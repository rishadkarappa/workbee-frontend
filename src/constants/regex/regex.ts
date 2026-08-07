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