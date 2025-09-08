// user validation
import apiError from "./apiError.js";

const ValidateUser = (userObj) => {
    const { fullName, userName, email, password } = userObj;

    // Only validate fields that are present in the request

    // Full name validation (if provided)
    if (fullName !== undefined) {
        if (typeof fullName !== "string" || !/^[A-Za-z\s]{3,30}$/.test(fullName.trim())) {
            throw new apiError(400, "Invalid full name", ["fullName"]);
        }
    }

    // Username validation (if provided)
    if (userName !== undefined) {
        if (typeof userName !== "string" || !/^@[A-Za-z0-9]{2,19}$/.test(userName.trim())) {
            throw new apiError(400, "Invalid user name. Must start with @ followed by 2-19 alphanumeric characters", [
                "userName",
            ]);
        }
    }

    // Email validation (if provided)
    if (email !== undefined) {
        if (typeof email !== "string" || !/^[\w.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim())) {
            throw new apiError(400, "Invalid email", ["email"]);
        }
    }

    // Password validation (if provided)
    if (password !== undefined) {
        if (
            typeof password !== "string" ||
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/.test(password.trim())
        ) {
            throw new apiError(
                400,
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
                ["password"]
            );
        }
    }
};

export { ValidateUser };
