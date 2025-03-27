export interface NewsletterRequest {
    email: string;
    listId: number;
    captchaToken: string;
}

export enum BrevoListEnum {
    Newsletter = 3
}