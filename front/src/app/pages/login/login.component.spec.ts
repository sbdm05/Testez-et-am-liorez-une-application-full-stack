import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { SessionInformation } from '../../core/models/sessionInformation.interface';
import { AuthService } from '../../core/service/auth.service';
import { SessionService } from '../../core/service/session.service';
import { LoginComponent } from './login.component';

const sessionInformation: SessionInformation = {
  token: 'fake-jwt',
  type: 'Bearer',
  id: 1,
  username: 'yoga@studio.com',
  firstName: 'Admin',
  lastName: 'Admin',
  admin: true,
};

// Petits utilitaires pour manipuler le DOM
const submitButton = (fixture: ComponentFixture<LoginComponent>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('button[type="submit"]');

const typeInto = (fixture: ComponentFixture<LoginComponent>, controlName: string, value: string): void => {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`);
  input.value = value;
  input.dispatchEvent(new Event('input')); // prévient Angular que la valeur a changé
};

// ---------------------------------------------------------------------------
// UNIT : AuthService et SessionService sont mockés
// ---------------------------------------------------------------------------
describe('LoginComponent (unit)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;

  const authServiceMock = { login: jest.fn() };
  const sessionServiceMock = { logIn: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  // Plan de test : Login – erreur en l'absence d'un champ obligatoire
  it('should have an invalid form and a disabled Submit button when empty', () => {
    expect(component.form.invalid).toBe(true);
    expect(submitButton(fixture).disabled).toBe(true);
  });

  it('should be invalid when the email is missing', () => {
    component.form.setValue({ email: '', password: 'test!1234' });

    expect(component.form.controls.email.hasError('required')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should be invalid when the email format is wrong', () => {
    component.form.setValue({ email: 'not-an-email', password: 'test!1234' });

    expect(component.form.controls.email.hasError('email')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should be invalid when the password is missing', () => {
    component.form.setValue({ email: 'yoga@studio.com', password: '' });

    expect(component.form.controls.password.hasError('required')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should enable the Submit button when the form is valid', () => {
    component.form.setValue({ email: 'yoga@studio.com', password: 'test!1234' });
    fixture.detectChanges();

    expect(submitButton(fixture).disabled).toBe(false);
  });

  // Plan de test : Login – la connexion
  it('submit() should log in, store the session and redirect to /sessions', () => {
    authServiceMock.login.mockReturnValue(of(sessionInformation));
    component.form.setValue({ email: 'yoga@studio.com', password: 'test!1234' });

    component.submit();

    expect(authServiceMock.login).toHaveBeenCalledWith({ email: 'yoga@studio.com', password: 'test!1234' });
    expect(sessionServiceMock.logIn).toHaveBeenCalledWith(sessionInformation);
    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
    expect(component.onError).toBe(false);
  });

  // Plan de test : Login – erreur en cas de mauvais login / password
  it('submit() should display an error when the login fails', () => {
    authServiceMock.login.mockReturnValue(throwError(() => new Error('401')));
    component.form.setValue({ email: 'yoga@studio.com', password: 'wrong' });

    component.submit();
    fixture.detectChanges();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    expect(sessionServiceMock.logIn).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should toggle the password visibility without submitting the form', () => {
    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('input[formcontrolname="password"]');
    const eyeButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-icon-button]');
    expect(passwordInput.type).toBe('password');

    eyeButton.click();
    fixture.detectChanges();

    expect(component.hide).toBe(false);
    expect(passwordInput.type).toBe('text');
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrais AuthService + SessionService, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('LoginComponent (integration)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Login – la connexion
  it('should log in through the API when the user fills and submits the form', () => {
    typeInto(fixture, 'email', 'yoga@studio.com');
    typeInto(fixture, 'password', 'test!1234');
    fixture.detectChanges();
    submitButton(fixture).click();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'yoga@studio.com', password: 'test!1234' });
    req.flush(sessionInformation);

    expect(sessionService.isLogged).toBe(true);
    expect(sessionService.sessionInformation).toEqual(sessionInformation);
    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  // Plan de test : Login – erreur en cas de mauvais login / password
  it('should display an error when the API rejects the credentials', () => {
    typeInto(fixture, 'email', 'yoga@studio.com');
    typeInto(fixture, 'password', 'wrong');
    fixture.detectChanges();
    submitButton(fixture).click();

    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    expect(sessionService.isLogged).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

    // Plan de test : Login – erreur en l'absence d'un champ obligatoire
  it('should keep Submit disabled and send no request while the password is empty', () => {
    typeInto(fixture, 'email', 'yoga@studio.com');
    fixture.detectChanges();

    expect(submitButton(fixture).disabled).toBe(true);
    submitButton(fixture).click();
    httpMock.expectNone('/api/auth/login');
  });

  it('should keep Submit disabled and send no request when the email format is invalid', () => {
    typeInto(fixture, 'email', 'not-an-email');
    typeInto(fixture, 'password', 'test!1234');
    fixture.detectChanges();

    expect(submitButton(fixture).disabled).toBe(true);
    submitButton(fixture).click();
    httpMock.expectNone('/api/auth/login');
  });
});