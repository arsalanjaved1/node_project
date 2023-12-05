
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