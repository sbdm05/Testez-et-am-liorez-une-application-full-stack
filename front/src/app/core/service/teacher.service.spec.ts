import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { TeacherService } from './teacher.service';
import { Teacher } from '../models/teacher.interface';

describe('TeacherService (unit)', () => {
  let service: TeacherService;
  let httpMock: HttpTestingController;

  const teacher: Teacher = {
    id: 1,
    firstName: 'Margot',
    lastName: 'Durand',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('all() should GET api/teacher and return the teachers', () => {
    let result: Teacher[] | undefined;

    service.all().subscribe(teachers => (result = teachers));

    const req = httpMock.expectOne('api/teacher');
    expect(req.request.method).toBe('GET');
    req.flush([teacher]);

    expect(result).toEqual([teacher]);
  });

  it('detail() should GET api/teacher/:id and return the teacher', () => {
    let result: Teacher | undefined;

    service.detail('1').subscribe(t => (result = t));

    const req = httpMock.expectOne('api/teacher/1');
    expect(req.request.method).toBe('GET');
    req.flush(teacher);

    expect(result).toEqual(teacher);
  });
});