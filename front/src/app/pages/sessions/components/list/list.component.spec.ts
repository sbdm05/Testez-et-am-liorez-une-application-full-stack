import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { expect, jest } from '@jest/globals';
import { of } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from './list.component';

const sessions: Session[] = [
  { id: 1, name: 'Yoga doux', description: 'Pour débutants', date: new Date('2026-10-10'), teacher_id: 1, users: [] },
  { id: 2, name: 'Vinyasa', description: 'Dynamique', date: new Date('2026-10-12'), teacher_id: 2, users: [] },
];

// Renvoie le texte de chaque bouton affiché (ex. "add Create", "search Detail")
const buttonTexts = (fixture: ComponentFixture<ListComponent>): string[] =>
  Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    .map(b => b.textContent ?? '');

// ---------------------------------------------------------------------------
// UNIT : SessionApiService et SessionService sont mockés
// ---------------------------------------------------------------------------
describe('ListComponent (unit)', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  const sessionApiServiceMock = { all: jest.fn() };
  const sessionServiceMock: { sessionInformation: any } = { sessionInformation: { id: 1, admin: true } };

  beforeEach(async () => {
    jest.clearAllMocks();
    sessionApiServiceMock.all.mockReturnValue(of(sessions));

    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SessionApiService, useValue: sessionApiServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
      ],
    }).compileComponents();
  });

  // Crée le composant pour un utilisateur admin ou non
  const createAs = (admin: boolean) => {
    sessionServiceMock.sessionInformation = { id: 1, admin };
    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should load the sessions from SessionApiService', () => {
    createAs(true);

    expect(sessionApiServiceMock.all).toHaveBeenCalledTimes(1);
  });

  it('user getter should return the logged user information', () => {
    createAs(false);

    expect(component.user).toEqual({ id: 1, admin: false });
  });

  // Plan de test : Sessions – affichage de la liste
  it('should display every session with its name and description', () => {
    createAs(false);
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('Yoga doux');
    expect(text).toContain('Pour débutants');
    expect(text).toContain('Vinyasa');
    expect(text).toContain('Dynamique');
  });

  // Plan de test : Sessions – boutons Create et Detail si admin
  it('should display Create, Detail and Edit buttons for an admin', () => {
    createAs(true);
    const texts = buttonTexts(fixture);

    expect(texts.filter(t => t.includes('Create'))).toHaveLength(1);
    expect(texts.filter(t => t.includes('Detail'))).toHaveLength(2); // un par session
    expect(texts.filter(t => t.includes('Edit'))).toHaveLength(2);
  });

  it('should hide Create and Edit buttons but keep Detail for a non-admin', () => {
    createAs(false);
    const texts = buttonTexts(fixture);

    expect(texts.some(t => t.includes('Create'))).toBe(false);
    expect(texts.some(t => t.includes('Edit'))).toBe(false);
    expect(texts.filter(t => t.includes('Detail'))).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrais services, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('ListComponent (integration)', () => {
  let fixture: ComponentFixture<ListComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    TestBed.inject(SessionService).logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
    });

    fixture = TestBed.createComponent(ListComponent);
    fixture.detectChanges(); // le pipe async s'abonne → GET api/session
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Sessions – affichage de la liste
  it('should fetch the sessions from the API and display them', () => {
    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('GET');
    req.flush(sessions);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Yoga doux');
    expect(text).toContain('Vinyasa');
    expect(buttonTexts(fixture).some(t => t.includes('Create'))).toBe(true);
  });

  it('should navigate to the session detail when clicking Detail', () => {
    httpMock.expectOne('api/session').flush(sessions);
    fixture.detectChanges();
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    buttons.find(b => b.textContent?.includes('Detail'))!.click();

    const urlTree = navigateSpy.mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe('/detail/1');
  });

    // Plan de test : Sessions – boutons Create et Detail si admin (cas non-admin)
  it('should hide Create and Edit buttons for a non-admin user', () => {
    // On reconnecte un utilisateur non-admin : le getter `user` lit l'état en direct
    TestBed.inject(SessionService).logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 2,
      username: 'user@studio.com',
      firstName: 'John',
      lastName: 'Doe',
      admin: false,
    });

    httpMock.expectOne('api/session').flush(sessions);
    fixture.detectChanges();
    const texts = buttonTexts(fixture);

    expect(texts.some(t => t.includes('Create'))).toBe(false);
    expect(texts.some(t => t.includes('Edit'))).toBe(false);
    expect(texts.filter(t => t.includes('Detail'))).toHaveLength(2);
  });

  it('should navigate to the update form when an admin clicks Edit', () => {
    httpMock.expectOne('api/session').flush(sessions);
    fixture.detectChanges();
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    buttons.find(b => b.textContent?.includes('Edit'))!.click();

    const urlTree = navigateSpy.mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe('/update/1');
  });
});