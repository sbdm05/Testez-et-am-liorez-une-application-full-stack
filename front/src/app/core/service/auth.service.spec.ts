import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { AuthService } from './auth.service';
import { LoginRequest } from '../models/loginRequest.interface';
import { RegisterRequest } from '../models/registerRequest.interface';
import { SessionInformation } from '../models/sessionInformation.interface';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // rregister test 
  it('register() should POST the register request to /api/auth/register', () => {
    const registerRequest: RegisterRequest = {
      email: 'new@user.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password',
    };
    let done = false;

    service.register(registerRequest).subscribe(() => (done = true));

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(null);

    expect(done).toBe(true);
  });

  
   it('login() should POST the login request to /api/auth/login and return the session information', () => {
    const loginRequest: LoginRequest = {
      email: 'yoga@studio.com',
      password: 'test!1234',
    };
    const sessionInformation: SessionInformation = {
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
    };
    let result: SessionInformation | undefined;

    service.login(loginRequest).subscribe(info => (result = info));

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(sessionInformation);

    expect(result).toEqual(sessionInformation);
  });

});