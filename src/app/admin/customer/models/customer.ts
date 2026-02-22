export interface Client {
   id?: string;
   organizationId?: string;
   firstName: string;
   lastName: string;
   email: string;
   phoneNumber: string;
   address?: string;
   addressLine2?: string;
   city?: string;
   state?: string;
   zip?: string;
}
