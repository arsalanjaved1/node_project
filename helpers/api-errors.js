
const codeToErrorMap = {
    '10-01' : {        
        real_error : "Could not find user in the database.",
        friendly_error : "Either the username or the password is incorrect."
    },
    '10-02' : {        
        real_error : "Passwords did not match.",
        friendly_error : "Either the username or the password is incorrect."
    }
}

function getErrorByCode(code) {
    if (!codeToErrorMap.hasOwnProperty(code)) {
        throw new Error("The error does not exist in the SYSTEM.");
    }

    console.log(`[API ERROR] => ${code}`);

    return {
        error : {
            code : code,
            message : codeToErrorMap[code].friendly_error
        }        
    };
}

module.exports =  {
    getErrorByCode
}