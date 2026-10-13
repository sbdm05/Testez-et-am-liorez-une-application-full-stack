import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { expect } from '@jest/globals';
import { Subject, of } from 'rxjs';

import { User } from '../../core/models/user.interface';
import { SessionService } from '../../core/service/session.service';
import { UserService } from '../../core/service/user.service';
import { MeComponent } from './me.component';

// Fabrique un faux utilisateur, admin ou non
const buildUser = (admin: boolean): User => ({
  id: 1,
  email: 'john@doe.com',
  firstName: 'John',
  lastName: 'Doe',
  admin,
  password: 'password',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-01'),
});

// ---------------------------------------------------------------------------
// UNIT : UserService et SessionService sont mockés
// ---------------------------------------------------------------------------
describe('MeComponent (unit)', () => {
  let component: MeComponent;
  let fixture: ComponentFixture<MeComponent>;
  let router: Router;
  let snackBar: MatSnackBar;

  const userServiceMock = { getById: jest.fn(), delete: jest.fn() };
  const sessionServiceMock = {
    sessionInformation: { id: 1, admin: false },
    logOut: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userServiceMock.getById.mockReturnValue(of(buildUser(false)));
    userServiceMock.delete.mockReturnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UserService, useValue: userServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    // MatSnackBar est fourni par MaterialModule : on espionne l'instance réellement injectée au composant
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);
  });

  // Plan de test : Account – affichage des informations de l'utilisateur
  it('should load the logged user on init', () => {
    fixture.detectChanges(); // déclenche ngOnInit

    expect(userServiceMock.getById).toHaveBeenCalledWith('1');
    expect(component.user).toEqual(buildUser(false));
  });

  it('should display the user information', () => {
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('John');
    expect(text).toMatch(/doe/i); // le nom peut être affiché en majuscules
    expect(text).toContain('john@doe.com');
  });

  it('should display "You are admin" for an admin user', () => {
    userServiceMock.getById.mockReturnValue(of(buildUser(true)));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You are admin');
  });

  it('should display the delete section for a non-admin user', () => {
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;

    expect(text).not.toContain('You are admin');
    expect(text).toContain('Delete my account');
  });

  it('back() should go back in the browser history', () => {
    const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});

    component.back();

    expect(backSpy).toHaveBeenCalled();
  });

  it('delete() should delete the account, show a message, log out and redirect', () => {
    component.delete();

    expect(userServiceMock.delete).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith('Your account has been deleted !', 'Close', { duration: 3000 });
    expect(sessionServiceMock.logOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('ngOnDestroy() should unsubscribe from the user request', () => {
    const user$ = new Subject<User>();
    userServiceMock.getById.mockReturnValue(user$);

    component.ngOnInit();
    component.ngOnDestroy();
    user$.next(buildUser(false)); // arrive après la destruction

    expect(component.user).toBeUndefined();
  });

  it('ngOnDestroy() should not fail when ngOnInit was never called', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrais UserService + SessionService, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('MeComponent (integration)', () => {
  let fixture: ComponentFixture<MeComponent>;
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    sessionService = TestBed.inject(SessionService);
    sessionService.logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      admin: false,
    });

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MeComponent);
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);

    fixture.detectChanges(); // ngOnInit → GET api/user/1
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Account – affichage des informations de l'utilisateur
  it('should fetch the logged user from the API and display it', () => {
    const req = httpMock.expectOne('api/user/1');
    expect(req.request.method).toBe('GET');
    req.flush(buildUser(false));
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('John');
    expect(text).toContain('john@doe.com');
  });

  it('should delete the account on click, log out and redirect to home', () => {
    httpMock.expectOne('api/user/1').flush(buildUser(false));
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const deleteButton = buttons.find(b => b.textContent?.includes('delete'));
    deleteButton!.click();

    const req = httpMock.expectOne('api/user/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(sessionService.isLogged).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Your account has been deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

    // Plan de test : Account – affichage des informations de l'utilisateur (cas admin)
  it('should show "You are admin" and no delete button when the API returns an admin', () => {
    httpMock.expectOne('api/user/1').flush(buildUser(true));
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('You are admin');
    expect(text).not.toContain('Delete my account');

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some(b => b.textContent?.includes('delete'))).toBe(false);
  });

  it('should go back in the browser history when clicking the back arrow', () => {
    httpMock.expectOne('api/user/1').flush(buildUser(false));
    fixture.detectChanges();
    const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    buttons.find(b => b.textContent?.includes('arrow_back'))!.click();

    expect(backSpy).toHaveBeenCalled();
  });
});