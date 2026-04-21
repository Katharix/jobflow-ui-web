import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueueCardComponent, QueueCustomer } from './queue-card.component';

const mockCustomer: QueueCustomer = {
  id: 'cust-001',
  name: 'Alice Smith',
  organizationName: 'Acme Corp',
  waitMinutes: 3,
  position: 2,
  avatarInitials: 'AS',
};

describe('QueueCardComponent', () => {
  let fixture: ComponentFixture<QueueCardComponent>;
  let component: QueueCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QueueCardComponent);
    component = fixture.componentInstance;
    component.customer = mockCustomer;
  });

  describe('showRemove = false (default)', () => {
    it('does not render the remove button', () => {
      component.showRemove = false;
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button[aria-label="Remove from queue"]');

      expect(btn).toBeNull();
    });
  });

  describe('showRemove = true', () => {
    it('renders the remove button', () => {
      component.showRemove = true;
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button[aria-label="Remove from queue"]');

      expect(btn).not.toBeNull();
    });

    it('clicking remove emits customer.id via the remove output', () => {
      component.showRemove = true;
      fixture.detectChanges();
      let emittedId: string | undefined;
      component.remove.subscribe((id: string) => (emittedId = id));

      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Remove from queue"]');
      btn.click();

      expect(emittedId).toBe(mockCustomer.id);
    });
  });

  it('clicking pick-up emits customer.id via the pickUp output', () => {
    fixture.detectChanges();
    let emittedId: string | undefined;
    component.pickUp.subscribe((id: string) => (emittedId = id));

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.qc-pickup-btn');
    btn.click();

    expect(emittedId).toBe(mockCustomer.id);
  });
});
