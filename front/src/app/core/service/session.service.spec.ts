import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';

import { SessionService } from './session.service';
import { SessionInformation } from '../models/sessionInformation.interface';

describe('SessionService', () => {
  let service: SessionService;


  //un faux utilisateur connecté
  const user: SessionInformation= {
    token: 'fake-jwt', 
    type: 'Bearer', 
    id : 1, 
    username: "yoga@studio.com", 
    firstName: "Admin", 
    lastName: "Admin", 
    admin : true
  }



  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
