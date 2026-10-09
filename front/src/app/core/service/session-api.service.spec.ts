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

  // test detail (id : String)
  it('detail(id ) should GET api/session/:id', () => {
    // to store result
    let result : Session | undefined; 
    service.detail('1').subscribe(data => result = data )

    const req = httpMock.expectOne('api/session/1'); 
    expect(req.request.method).toBe('GET'); 

    // use this mock session for the test
    req.flush(session)

    expect(result).toEqual(session)

  });


    // test delete (id : String)
  it('detail(id ) should DELETE api/session/:id', () => {
    let isDeleted = false;
    service.delete('1').subscribe(() => isDeleted = true )

    const req = httpMock.expectOne('api/session/1'); 
    expect(req.request.method).toBe('DELETE'); 

    // use this mock session for the test
    req.flush(session)

    expect(isDeleted).toBe(true)

  });

  // test create
  it('create(session) should POST api/session', () => {
    let result: Session | undefined; 
    service.create(session).subscribe((session) => result = session )

    const req = httpMock.expectOne('api/session'); 
    expect(req.request.method).toBe('POST'); 
    expect(req.request.body).toEqual(session)

    // use this mock session for the test
    req.flush(session)

    expect(result).toEqual(session); 

  });

    // test update
  it('update(session) should POST api/session/:id', () => {
    let result: Session | undefined; 
    service.update("1", session).subscribe((session) => result = session )

    const req = httpMock.expectOne('api/session/1'); 
    expect(req.request.method).toBe('PUT'); 
    expect(req.request.body).toEqual(session)

    // use this mock session for the test
    req.flush(session)

    expect(result).toEqual(session); 

  });



});
