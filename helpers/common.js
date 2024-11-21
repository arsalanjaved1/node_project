module.exports = {
    calculateAge
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Calculate age difference in years
    let age = today.getFullYear() - birthDate.getFullYear();

    // Adjust if birthday hasn't occurred this year
    if (today.getMonth() < birthDate.getMonth() || 
        ( today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate() )
    ) {
        age--;
    }

    return age >= 0 ? age : 0; // Return 0 for future dates
}
