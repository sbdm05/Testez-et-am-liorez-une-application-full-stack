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
import { FormComponent } from './form.component';

const CREATE_URL = '/sessions/create';
const UPDATE_URL = '/sessions/update/1';

const existingSession: Session = {
  id: 1,
  name: 'Yoga doux',
  description: 'Séance pour débutants',
  date: new Date('2026-10-10'),
  teacher_id: 2,
  users: [],
};

const teachers: Teacher[] = [
  { id: 1, firstName: 'Sophie', lastName: 'Durand', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, firstName: 'Jess', lastName: 'Doe', createdAt: new Date(), updatedAt: new Date() },
];

// Ce que contient le formulaire une fois rempli
const formValue = {
  name: 'Vinyasa',
  date: '2026-11-01',
  teacher_id: 1,
  description: 'Séance dynamique',
};

const activatedRouteStub = { snapshot: { paramMap: convertToParamMap({ id: '1' }) } };

const saveButton = (fixture: ComponentFixture<FormComponent>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('button[type="submit"]');

const typeInto = (fixture: ComponentFixture<FormComponent>, controlName: string, value: string): void => {
  const field: HTMLInputElement | HTMLTextAreaElement =
    fixture.nativeElement.querySelector(`[formcontrolname="${controlName}"]`);
  field.value = value;
  field.dispatchEvent(new Event('input'));
};

// ---------------------------------------------------------------------------
// UNIT : tous les services sont mockés
// ---------------------------------------------------------------------------
describe('FormComponent (unit)', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let router: Router;
  let snackBar: MatSnackBar;

  const sessionApiServiceMock = { detail: jest.fn(), create: jest.fn(), update: jest.fn() };
  const teacherServiceMock = { all: jest.fn() };
  const sessionServiceMock: { sessionInformation: any } = { sessionInformation: { id: 1, admin: true } };

  beforeEach(async () => {
    jest.clearAllMocks();
    teacherServiceMock.all.mockReturnValue(of(teachers));
    sessionApiServiceMock.detail.mockReturnValue(of(existingSession));
    sessionApiServiceMock.create.mockReturnValue(of(existingSession));
    sessionApiServiceMock.update.mockReturnValue(of(existingSession));

    await TestBed.configureTestingModule({
      imports: [FormComponent],
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

  // Crée le composant comme si l'utilisateur (admin ou non) était sur l'URL donnée
  const createAt = (url: string, admin = true) => {
    sessionServiceMock.sessionInformation = { id: 1, admin };

    router = TestBed.inject(Router);
    jest.spyOn(router, 'url', 'get').mockReturnValue(url); // simule l'URL courante
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);

    fixture.detectChanges(); // ngOnInit
  };

  it('should redirect a non-admin user to /sessions', () => {
    createAt(CREATE_URL, false);

    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  // --- Mode création -------------------------------------------------------

  it('should start in create mode with an empty form', () => {
    createAt(CREATE_URL);

    expect(component.onUpdate).toBe(false);
    expect(component.sessionForm!.value).toEqual({ name: '', date: '', teacher_id: '', description: '' });
    expect(fixture.nativeElement.textContent).toContain('Create session');
    expect(teacherServiceMock.all).toHaveBeenCalled();
    expect(sessionApiServiceMock.detail).not.toHaveBeenCalled();
  });

  // Plan de test : Création session – erreur en l'absence d'un champ obligatoire
  it('should have an invalid form and a disabled Save button when empty', () => {
    createAt(CREATE_URL);

    expect(component.sessionForm!.invalid).toBe(true);
    expect(saveButton(fixture).disabled).toBe(true);
  });

  it.each(['name', 'date', 'teacher_id', 'description'])(
    'should be invalid when %s is missing',
    (field) => {
      createAt(CREATE_URL);
      component.sessionForm!.setValue({ ...formValue, [field]: '' });

      expect(component.sessionForm!.get(field)!.hasError('required')).toBe(true);
      expect(component.sessionForm!.invalid).toBe(true);
    },
  );

  // Plan de test : Création session – la session est créée
  it('submit() in create mode should create the session, show a message and go back to the list', () => {
    createAt(CREATE_URL);
    component.sessionForm!.setValue(formValue);

    component.submit();

    expect(sessionApiServiceMock.create).toHaveBeenCalledWith(formValue);
    expect(sessionApiServiceMock.update).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  // --- Mode modification ---------------------------------------------------

  it('should start in update mode and prefill the form with the existing session', () => {
    createAt(UPDATE_URL);

    expect(component.onUpdate).toBe(true);
    expect(sessionApiServiceMock.detail).toHaveBeenCalledWith('1');
    expect(component.sessionForm!.value).toEqual({
      name: 'Yoga doux',
      date: '2026-10-10',
      teacher_id: 2,
      description: 'Séance pour débutants',
    });
    expect(fixture.nativeElement.textContent).toContain('Update session');
  });

  // Plan de test : Modification session – erreur en l'absence d'un champ obligatoire
  it('should become invalid in update mode when a required field is cleared', () => {
    createAt(UPDATE_URL);

    component.sessionForm!.get('name')!.setValue('');
    fixture.detectChanges();

    expect(component.sessionForm!.invalid).toBe(true);
    expect(saveButton(fixture).disabled).toBe(true);
  });

  // Plan de test : Modification session – la session est modifiée
  it('submit() in update mode should update the session, show a message and go back to the list', () => {
    createAt(UPDATE_URL);
    component.sessionForm!.setValue(formValue);

    component.submit();

    expect(sessionApiServiceMock.update).toHaveBeenCalledWith('1', formValue);
    expect(sessionApiServiceMock.create).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });
});

// ---------------------------------------------------------------------------
// INTEGRATION : vrais services, seul le réseau est simulé
// ---------------------------------------------------------------------------
describe('FormComponent (integration)', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let snackBar: MatSnackBar;

  const setupAt = async (url: string) => {
    await TestBed.configureTestingModule({
      imports: [FormComponent],
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
    jest.spyOn(router, 'url', 'get').mockReturnValue(url);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(SessionService).logIn({
      token: 'fake-jwt',
      type: 'Bearer',
      id: 1,
      username: 'yoga@studio.com',
      firstName: 'Admin',
      lastName: 'Admin',
      admin: true,
    });

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(snackBar, 'open').mockReturnValue({} as any);
    fixture.detectChanges();
  };

  // Répond à la requête de la liste des professeurs (déclenchée par le pipe async)
  const answerTeachers = () => {
    httpMock.match('api/teacher').forEach(req => req.flush(teachers));
    fixture.detectChanges();
  };

  afterEach(() => {
    httpMock.verify();
  });

  // Plan de test : Création session – la session est créée
  it('should create a session through the API when the admin fills and saves the form', async () => {
    await setupAt(CREATE_URL);
    answerTeachers();

    typeInto(fixture, 'name', formValue.name);
    typeInto(fixture, 'date', formValue.date);
    typeInto(fixture, 'description', formValue.description);
    component.sessionForm!.get('teacher_id')!.setValue(formValue.teacher_id); // liste déroulante Material
    fixture.detectChanges();
    saveButton(fixture).click();

    const req = httpMock.expectOne('api/session');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(formValue);
    req.flush({ ...formValue, id: 3, users: [] });

    expect(snackBar.open).toHaveBeenCalledWith('Session created !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  // Plan de test : Création session – erreur en l'absence d'un champ obligatoire
  it('should keep Save disabled and send nothing while a required field is empty', async () => {
    await setupAt(CREATE_URL);
    answerTeachers();

    typeInto(fixture, 'name', formValue.name);
    typeInto(fixture, 'date', formValue.date);
    fixture.detectChanges(); // professeur et description manquants

    expect(saveButton(fixture).disabled).toBe(true);
    // httpMock.verify() (afterEach) garantit qu'aucun POST n'est parti
  });

  // Plan de test : Modification session – la session est modifiée
  it('should load the session, let the admin edit it and save it through the API', async () => {
    await setupAt(UPDATE_URL);

    httpMock.expectOne('api/session/1').flush(existingSession);
    fixture.detectChanges();
    answerTeachers();

    const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('[formcontrolname="name"]');
    expect(nameInput.value).toBe('Yoga doux');

    typeInto(fixture, 'name', 'Yoga très doux');
    fixture.detectChanges();
    saveButton(fixture).click();

    const req = httpMock.expectOne('api/session/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      name: 'Yoga très doux',
      date: '2026-10-10',
      teacher_id: 2,
      description: 'Séance pour débutants',
    });
    req.flush(existingSession);

    expect(snackBar.open).toHaveBeenCalledWith('Session updated !', 'Close', { duration: 3000 });
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });
});