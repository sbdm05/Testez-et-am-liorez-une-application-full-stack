import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { expect, jest } from '@jest/globals';
import { of } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { DetailComponent } from './detail.component';

// Une session avec la liste des participants donnée
const buildSession = (users: number[]): Session => ({
  id: 1,
  name: 'summer yoga',
  description: 'Séance pour experts',
  date: new Date('2026-10-10'),
  teacher_id: 2,
  users,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-01'),
});

const teacher: Teacher = {
  id: 2,
  firstName: 'Sophie',
  lastName: 'Durand',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// Simule l'URL /sessions/detail/1
const activatedRouteStub = { snapshot: { paramMap: convertToParamMap({ id: '1' }) } };

const buttonTexts = (fixture: ComponentFixture<DetailComponent>): string[] =>
  Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    .map(b => b.textContent ?? '');

const clickButton = (fixture: ComponentFixture<DetailComponent>, label: string): void => {
  const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
  buttons.find(b => b.textContent?.includes(label))!.click();
};

// ---------------------------------------------------------------------------
// UNIT : tous les services sont mockés
// ---------------------------------------------------------------------------
describe('DetailComponent (unit)', () => {
  let component: DetailComponent;
  let fixture: ComponentFixture<DetailComponent>;
  let router: Router;
  let snackBar: MatSnackBar;

  const sessionApiServiceMock = {
    detail: jest.fn(),
    delete: jest.fn(),
    participate: jest.fn(),
    unParticipate: jest.fn(),
  };
  const teacherServiceMock = { detail: jest.fn() };
  const sessionServiceMock: { sessionInformation: any } = { sessionInformation: { id: 1, admin: false } };

  beforeEach(async () => {
    jest.clearAllMocks();
    teacherServiceMock.detail.mockReturnValue(of(teacher));
    sessionApiServiceMock.delete.mockReturnValue(of(null));
    sessionApiServiceMock.participate.mockReturnValue(of(undefined));
    sessionApiServiceMock.unParticipate.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: SessionApiService, useValue: sessionApiServiceMock },
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();
  });

  // Le constructeur lit l'utilisateur connecté : il faut tout régler AVANT createComponent
  const createAs = (admin: boolean, users: number[] = []) => {
    sessionServiceMock.sessionInformation = { id: 1, admin };
    sessionApiServiceMock.detail.mockReturnValue(of(buildSession(users)));

    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);

    fixture.detectChanges(); // ngOnInit → fetchSession()
  };

  it('should read the session id from the URL and the user from SessionService', () => {
    createAs(true);

    expect(component.sessionId).toBe('1');
    expect(component.userId).toBe('1');
    expect(component.isAdmin).toBe(true);
  });

  it('should fetch the session and its teacher on init', () => {
    createAs(false);

    expect(sessionApiServiceMock.detail).toHaveBeenCalledWith('1');
    expect(teacherServiceMock.detail).toHaveBeenCalledWith('2');
    expect(component.session).toEqual(buildSession([]));
    expect(component.teacher).toEqual(teacher);
    expect(component.isParticipate).toBe(false);
  });

  it('should set isParticipate to true when the user is in the session', () => {
    createAs(false, [1]);

    expect(component.isParticipate).toBe(true);
  });

  // Plan de test : Informations session – les informations sont correctement affichées
  it('should display the session information', () => {
    createAs(false, [1, 3]);
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('Summer Yoga');          // pipe titlecase
    expect(text).toContain('Séance pour experts');
    expect(text).toContain('2 attendees');
    expect(text).toContain('Sophie DURAND');    // pipe uppercase
  });

  // Plan de test : Informations session – bouton Delete si admin
  it('should display the Delete button and no Participate button for an admin', () => {
    createAs(true);
    const texts = buttonTexts(fixture);

    expect(texts.some(t => t.includes('Delete'))).toBe(true);
    expect(texts.some(t => t.includes('Participate'))).toBe(false);
  });

  it('should display Participate and no Delete for a non-admin who is not in the session', () => {
    createAs(false, []);
    const texts = buttonTexts(fixture);

    expect(texts.some(t => t.includes('Participate'))).toBe(true);
    expect(texts.some(t => t.includes('Delete'))).toBe(false);
  });

  it('should display "Do not participate" for a non-admin who is in the session', () => {
    createAs(false, [1]);
    const texts = buttonTexts(fixture);

    expect(texts.some(t => t.includes('Do not participate'))).toBe(true);
  });

  // Plan de test : Suppression session – la session est correctement supprimée
  it('delete() should delete the session, show a message and go back to the list', () => {
    createAs(true);

    component.delete();

    expect(sessionApiServiceMock.delete).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('participate() should register the user and reload the session', () => {
    createAs(false);

    component.participate();

    expect(sessionApiServiceMock.participate).toHaveBeenCalledWith('1', '1');
    expect(sessionApiServiceMock.detail).toHaveBeenCalledTimes(2); // init + rechargement
  });

  it('unParticipate() should unregister the user and reload the session', () => {
    createAs(false, [1]);

    component.unParticipate();

    expect(sessionApiServiceMock.unParticipate).toHaveBeenCalledWith('1', '1');
    expect(sessionApiServiceMock.detail).toHaveBeenCalledTimes(2);
  });

  it('back() should go back in the browser history', () => {
    createAs(false);
    const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});

    component.back();

    expect(backSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrais services, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('DetailComponent (integration)', () => {
  let fixture: ComponentFixture<DetailComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let snackBar: MatSnackBar;

  const setup = async (admin: boolean) => {
    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(SessionService).logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'user@studio.com',
      firstName: 'John',
      lastName: 'Doe',
      admin,
    });

    fixture = TestBed.createComponent(DetailComponent);
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);
    fixture.detectChanges(); // → GET api/session/1
  };

  // Répond aux 2 requêtes de fetchSession() : la session, puis son professeur
  const answerFetch = (users: number[]) => {
    httpMock.expectOne('api/session/1').flush(buildSession(users));
    httpMock.expectOne('api/teacher/2').flush(teacher);
    fixture.detectChanges();
  };

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Informations session – les informations sont correctement affichées
  it('should load the session and its teacher from the API and display them', async () => {
    await setup(false);

    answerFetch([1]);

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Summer Yoga');
    expect(text).toContain('Sophie DURAND');
    expect(text).toContain('1 attendees');
  });

  // Plan de test : Suppression session – la session est correctement supprimée
  it('should delete the session through the API when an admin clicks Delete', async () => {
    await setup(true);
    answerFetch([]);

    clickButton(fixture, 'Delete');

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(snackBar.open).toHaveBeenCalledWith('Session deleted !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('should register the user and switch the button to "Do not participate"', async () => {
    await setup(false);
    answerFetch([]);

    clickButton(fixture, 'Participate');

    const req = httpMock.expectOne('api/session/1/participate/1');
    expect(req.request.method).toBe('POST');
    req.flush(null);
    answerFetch([1]); // la session est rechargée, l'utilisateur y figure

    expect(buttonTexts(fixture).some(t => t.includes('Do not participate'))).toBe(true);
  });

  it('should unregister the user and switch the button back to "Participate"', async () => {
    await setup(false);
    answerFetch([1]);

    clickButton(fixture, 'Do not participate');

    const req = httpMock.expectOne('api/session/1/participate/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    answerFetch([]);

    const texts = buttonTexts(fixture);
    expect(texts.some(t => t.includes('Participate') && !t.includes('Do not'))).toBe(true);
  });

    // Plan de test : Informations session – bouton Delete si admin (cas admin)
  it('should show the Delete button and no Participate button to an admin', async () => {
    await setup(true);
    answerFetch([]);

    const texts = buttonTexts(fixture);
    expect(texts.some(t => t.includes('Delete'))).toBe(true);
    expect(texts.some(t => t.includes('Participate'))).toBe(false);
  });

  // Plan de test : Informations session – bouton Delete si admin (cas non-admin)
  it('should hide the Delete button from a non-admin user', async () => {
    await setup(false);
    answerFetch([]);

    const texts = buttonTexts(fixture);
    expect(texts.some(t => t.includes('Delete'))).toBe(false);
    expect(texts.some(t => t.includes('Participate'))).toBe(true);
  });
});