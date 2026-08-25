export const sendJwtToClient = (user, res) => {
    const token = user.generateJwtToken();

    return res.status(200).cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE) * 1000 * 60),
        secure: process.env.NODE_ENV === "development" ? false : true
    })
    .json({
        success: true,
        access_token: token,
        data: {
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
};

export const isTokenIncluded = (req) => {
    return (
        (req.headers.authorization && req.headers.authorization.startWith('Bearer'))
    );
};

export const getAccessTokenFromHeader = (req) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return null;
    }

    const token = authorization.split(/Bearer:?\s+/)[1];
    return token || null;
};