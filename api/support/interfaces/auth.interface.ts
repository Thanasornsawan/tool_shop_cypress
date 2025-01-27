export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    error: string;
}

export interface ErrorResponse {
    message: string;
}