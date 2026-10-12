import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './core/service/auth.service';
import { SessionService } from './core/service/session.service';

const navText = (fixture: ComponentFixture<AppComponent>): string =>
  fixture.nativeElement.querySelector('mat-toolbar').textContent;

const clickLogout = (fixture: ComponentFixture<AppComponent>): void => {
  const spans: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('span.link'));
  spans.find(s => s.textContent?.includes('Logout'))!.click();
};

// ---------------------------------------------------------------------------
// UNIT : SessionService est mocké
// ---------------------------------------------------------------------------
describe('AppComponent (unit)', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  const sessionServiceMock = { $isLogged: jest.fn(), logOut: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: AuthService, useValue: {} }, // injecté mais pas utilisé
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  const createAs = (logged: boolean) => {
    sessionServiceMock.$isLogged.mockImplementation(() => of(logged));
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('$isLogged() should return the login state from SessionService', () => {
    createAs(true);
    let value: boolean | undefined;

    component.$isLogged().subscribe(v => (value = v));

    expect(value).toBe(true);
    expect(sessionServiceMock.$isLogged).toHaveBeenCalled();
  });

  it('should display Login and Register links when the user is logged out', () => {
    createAs(false);
    const text = navText(fixture);

    expect(text).toContain('Login');
    expect(text).toContain('Register');
    expect(text).not.toContain('Logout');
  });

  it('should display Sessions, Account and Logout links when the user is logged in', () => {
    createAs(true);
    const text = navText(fixture);

    expect(text).toContain('Sessions');
    expect(text).toContain('Account');
    expect(text).toContain('Logout');
    expect(text).not.toContain('Register');
  });

  // Plan de test : Logout – la déconnexion de l'utilisateur
  it('logout() should log the user out and redirect to the home page', () => {
    createAs(true);

    component.logout();

    expect(sessionServiceMock.logOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrai SessionService, la barre réagit à la connexion
// ---------------------------------------------------------------------------
describe('AppComponent (integration)', () => {
  let fixture: ComponentFixture<AppComponent>;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  const logIn = () => {
    sessionService.logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
    });
    fixture.detectChanges();
  };

  it('should show the logged-out links by default', () => {
    expect(navText(fixture)).toContain('Login');
    expect(navText(fixture)).not.toContain('Logout');
  });

  it('should switch to the logged-in links as soon as the user logs in', () => {
    logIn();

    expect(navText(fixture)).toContain('Logout');
    expect(navText(fixture)).not.toContain('Register');
  });

  // Plan de test : Logout – la déconnexion de l'utilisateur
  it('should log out, redirect and show the logged-out links when clicking Logout', () => {
    logIn();

    clickLogout(fixture);
    fixture.detectChanges();

    expect(sessionService.isLogged).toBe(false);
    expect(sessionService.sessionInformation).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['']);
    expect(navText(fixture)).toContain('Login');
    expect(navText(fixture)).not.toContain('Logout');
  });
})