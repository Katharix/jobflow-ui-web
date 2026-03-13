import {NavService} from './nav.service';

describe('NavService', () => {
   let service: NavService;

   beforeEach(() => {
      service = new NavService();
   });

   it('returns empty array for unmatched paths', () => {
      const items = service.getNavItems('/something/unmapped');
      expect(items).toEqual([]);
   });

   it('returns company nav with invoicing active on invoices route', () => {
      const items = service.getNavItems('/admin/company');
      const invoicing = items.find((x) => x.label === 'Invoicing');

      expect(invoicing).toBeTruthy();
      expect(invoicing?.route).toBe('/admin/invoices');
   });

   it('marks exact route active when path matches route', () => {
      const items = service.getNavItems('/admin/settings/branding');
      const branding = items.find((x) => x.label === 'Branding');

      expect(branding?.active).toBeTrue();
   });

   it('marks deep routes active when allowDeepMatch is enabled', () => {
      const items = service.getNavItems('/admin/employees/scheduling-employees/day');
      const scheduling = items.find((x) => x.label === 'Scheduling');

      expect(scheduling?.active).toBeTrue();
   });
});