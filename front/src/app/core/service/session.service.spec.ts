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

  it('should be logged out by default', () => {
    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined(); 
  });

  it('should store the user and set IsLogged to true when loggedin', () => {
    service.logIn(user); 

    expect(service.isLogged).toBe(true); 
    expect(service.sessionInformation).toEqual(user);

  });

  it('should store the user and set IsLogged to true when loggedin', () => {
    service.logIn(user); 

    expect(service.isLogged).toBe(true); 
    expect(service.sessionInformation).toEqual(user);

  });

  // test de l'observable 
  it('should emit the login state using $isLogged()', () => {
    // on crée dans un tableau
    const states : boolean[] = []; 

    // on subscribe
    service.$isLogged().subscribe(state => states.push(state)); 

    // on déclenche
    service.logIn(user);
    service.logOut(); 
    
    expect(states).toEqual([false, true, false]); 


  });

});
