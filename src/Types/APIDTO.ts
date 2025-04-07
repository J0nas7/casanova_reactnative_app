export type apiResponseDTO = {
    success: boolean,
    message: string,
    data: any
}

export type axiosHeaders = {
    Accept: string;
    Authorization: string;
    "Content-Type"?: string;
}

export type postContent = { [key: string]: any }