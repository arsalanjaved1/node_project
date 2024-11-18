
const codeToErrorMap = {
    '10-01' : {        
        real_error : "Could not find user in the database.",
        friendly_error : "Either the username or the password is incorrect."
    },
    '10-02' : {        
        real_error : "Passwords did not match.",
        friendly_error : "Either the username or the password is incorrect."
    },
    '10-03' : {        
        real_error : "There was a problem inserting the refresh_token in the database.",
        friendly_error : "Something went wrong."
    },
    '10-04' : {        
        real_error : "Could not find refresh token in the database.",
        friendly_error : "Please re-authenticate."
    },
    '10-05' : {        
        real_error : "Could not insert revoked token in the database.",
        friendly_error : "Could not log out. Please try again."
    },
    '10-06' : {        
        real_error : "Could not insert forgot password token in the database.",
        friendly_error : "Unable to cater your request at the moment. Please try again."
    },
    '10-07' : {        
        real_error : "Could not find user in the database.",
        friendly_error : "Could not find the user."
    },
    '10-08' : {        
        real_error : "User requesting for password change is not the same user as mentioned in the request (FORBIDDEN).",
        friendly_error : "Incorrect email address."
    },
    '10-09' : {        
        real_error : "Could not update user's password in the database.",
        friendly_error : "Could not change password. Please try again."
    },
    '10-10' : {        
        real_error : "User's existing password is the same as the new one.",
        friendly_error : "Please choose a different password than the new one."
    },    
    '10-11' : {        
        real_error : "Could not find forogt password request in the database.",
        friendly_error : "Either the token has expired or it does not exist."
    },    
    '10-12' : {        
        real_error : "Forgot Password token hash does not match with the token provided in the request.",
        friendly_error : "The token provided is incorrect."
    },    
    '10-13' : {        
        real_error : "Unable to verify google ID Token.",
        friendly_error : "We could not authenticate you with Google. Please try again."
    },
    '10-14' : {
        real_error : "There was a problem inserting the user in the database.",
        friendly_error : "Something went wrong."
    },
    '10-1000': {
        real_error: "Service unavailable. Please try again.",
        friendly_error: "An error has occurred. Please try again later."
    }
}

function getErrorByCode(code) {
    if (!codeToErrorMap.hasOwnProperty(code)) {
        throw new Error("The error does not exist in the SYSTEM.");
    }

    console.log(`[API ERROR] => ${code}`);
    console.log(codeToErrorMap[code]);

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