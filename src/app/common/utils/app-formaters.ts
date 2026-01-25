export function formatPhone(value?: string): string {
   if (!value) return '';

   const digits = value.replace(/\D/g, '');

   if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
   }

   return value; // fallback
}

export function formatDateTime(
   value: string | Date | null | undefined
): string {

   if (!value) {
      return 'Not yet scheduled';
   }

   const date = new Date(value);

   // Guard against .NET DateTime.MinValue and garbage
   if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
      return 'Not yet scheduled';
   }

   const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
   });

   const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
   });

   return `${datePart} at ${timePart}`;
}
