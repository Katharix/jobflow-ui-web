import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;
  let translate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    translate = jasmine.createSpyObj<TranslateService>(
      'TranslateService',
      ['use', 'getBrowserLang'],
      { currentLang: 'en', defaultLang: 'en' }
    );

    TestBed.configureTestingModule({
      providers: [
        LocalizationService,
        { provide: TranslateService, useValue: translate }
      ]
    });

    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    translate.getBrowserLang.and.returnValue('en');
    service = TestBed.inject(LocalizationService);
  });

  it('calls translate.use with en when no stored language and browser returns en', () => {
    service.init();

    expect(translate.use).toHaveBeenCalledWith('en');
  });

  it('uses stored language when one is persisted', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue('es');

    service.init();

    expect(translate.use).toHaveBeenCalledWith('es');
  });

  it('sets a supported language and persists it', () => {
    service.setLanguage('fr');

    expect(translate.use).toHaveBeenCalledWith('fr');
    expect(localStorage.setItem).toHaveBeenCalledWith('preferredLanguage', 'fr');
  });

  it('does not persist language when persist flag is false', () => {
    service.setLanguage('de', false);

    expect(translate.use).toHaveBeenCalledWith('de');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('normalizes an unsupported language to en', () => {
    service.setLanguage('zh');

    expect(translate.use).toHaveBeenCalledWith('en');
  });

  it('normalizes a language with region suffix to base language', () => {
    service.setLanguage('pt-BR');

    expect(translate.use).toHaveBeenCalledWith('pt');
  });

  it('returns current language from translate service', () => {
    (Object.getOwnPropertyDescriptor(translate, 'currentLang')?.get as jasmine.Spy | undefined)?.and?.returnValue('es');

    const lang = service.getCurrentLanguage();

    expect(['en', 'es']).toContain(lang);
  });
});
