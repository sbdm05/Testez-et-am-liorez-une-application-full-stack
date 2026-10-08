import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { SessionApiService } from './session-api.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Session } from '../models/session.interface';

describe('SessionsService', () => {
  let service: SessionApiService;
  let httpMock: HttpTestingController; 

  // session test
  const session: Session = {
    id: 1,
    name: 'Yoga Hiver',
    description: 'Séance etirements',
    date: new Date('2026-10-10'),
    teacher_id: 1,
    users: []
  }



  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        provideHttpClient(), provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SessionApiService);
    httpMock = TestBed.inject(HttpTestingController)
  });

  afterEach(()=> {
    httpMock.verify()
  })

  // test all()
  it('all() should GET api/session', () => {
    // to store result
    let result : Session [] | undefined; 
    service.all().subscribe(data => result = data )

    const req = httpMock.expectOne('api/session'); 
    expect(req.request.method).toBe('GET'); 

    // use this mock session for the test
    req.flush([session])

    expect(result).toEqual([session])

  });

  // test 




});
