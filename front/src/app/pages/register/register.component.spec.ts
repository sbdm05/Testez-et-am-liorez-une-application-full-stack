import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/service/auth.service';
import { RegisterComponent } from './register.component';

const validForm = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@doe.com',
  password: 'test!1234',
};

const submitButton = (fixture: ComponentFixture<RegisterComponent>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('button[type="submit"]');

const typeInto = (fixture: ComponentFixture<RegisterComponent>, controlName: string, value: string): void => {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

// ---------------------------------------------------------------------------
// UNIT : AuthService est mocké
// ---------------------------------------------------------------------------
describe('RegisterComponent (unit)', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: Router;

  const authServiceMock = { register: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  // Plan de test : Register – erreur en l'absence d'un champ obligatoire
  it('should have an invalid form and a disabled Submit button when empty', () => {
    expect(component.form.invalid).toBe(true);
    expect(submitButton(fixture).disabled).toBe(true);
  });

  it.each(['firstName', 'lastName', 'email', 'password'])(
    'should be invalid when %s is missing',
    (field) => {
      component.form.setValue({ ...validForm, [field]: '' });

      expect(component.form.get(field)!.hasError('required')).toBe(true);
      expect(component.form.invalid).toBe(true);
    },
  );

  it('should be invalid when the email format is wrong', () => {
    component.form.setValue({ ...validForm, email: 'not-an-email' });

    expect(component.form.get('email')!.hasError('email')).toBe(true);
  });

  it('should enable the Submit button when the form is valid', () => {
    component.form.setValue(validForm);
    fixture.detectChanges();

    expect(submitButton(fixture).disabled).toBe(false);
  });

  // Plan de test : Register – la création de compte
  it('submit() should register the user and redirect to /login', () => {
    authServiceMock.register.mockReturnValue(of(undefined));
    component.form.setValue(validForm);

    component.submit();

    expect(authServiceMock.register).toHaveBeenCalledWith(validForm);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.onError).toBe(false);
  });

  it('submit() should display an error when the registration fails', () => {
    authServiceMock.register.mockReturnValue(throwError(() => new Error('400')));
    component.form.setValue(validForm);

    component.submit();
    fixture.detectChanges();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrai AuthService, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('RegisterComponent (integration)', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const fillForm = () => {
    typeInto(fixture, 'firstName', validForm.firstName);
    typeInto(fixture, 'lastName', validForm.lastName);
    typeInto(fixture, 'email', validForm.email);
    typeInto(fixture, 'password', validForm.password);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Register – la création de compte
  it('should create the account through the API and redirect to /login', () => {
    fillForm();
    submitButton(fixture).click();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(validForm);
    req.flush(null);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should display an error when the API refuses the registration (email already taken)', () => {
    fillForm();
    submitButton(fixture).click();

    httpMock
      .expectOne('/api/auth/register')
      .flush({ message: 'Error: Email is already taken!' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('An error occurred');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should keep Submit disabled while a required field is empty', () => {
    typeInto(fixture, 'firstName', validForm.firstName);
    typeInto(fixture, 'email', validForm.email);
    typeInto(fixture, 'password', validForm.password);
    fixture.detectChanges(); // lastName reste vide

    expect(submitButton(fixture).disabled).toBe(true);
  });
});