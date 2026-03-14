import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });

  it('should expose app-root selector metadata', () => {
    const selectors = (AppComponent as any).ɵcmp?.selectors;
    expect(selectors?.[0]?.[0]).toBe('app-root');
  });
});
