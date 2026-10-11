import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { UserService } from './user.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { User } from '../models/user.interface';

describe('UserService', () => {
   let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // test getById()
  it('getById() should GET api/user/:id and return the user', () => {
    const user: User = {
      id: 1,
      email: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
      password: 'test!1234',
      createdAt: new Date('2026-01-01'),
    };
    let result: User | undefined;

    service.getById('1').subscribe(u => (result = u));

    const req = httpMock.expectOne('api/user/1');
    expect(req.request.method).toBe('GET');
    req.flush(user);

    expect(result).toEqual(user);
  });

});
