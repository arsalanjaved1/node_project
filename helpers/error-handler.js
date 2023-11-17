module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    console.error(err);

    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({ message: err });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        // const verified = await jwt.verify(token, conf.secret);
        if (err.inner.name === 'JsonWebTokenError')
            return res.status(401).json({ message: 'Invalid Token' });

        if (err.inner.name === 'TokenExpiredError')
            return res.status(401).json({ message: 'Jwt Token Expired' });

        if (err.inner.message === 'No authorization token was found')
            return res.status(401).json({ message: err.inner.message });        
        
        return res.status(401).json({ message: 'Invalid Token' });        
    }
    
    // default to 500 server error
    return res.status(500).json({ message: err.message });
}