import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseTagComponent } from './database-tag.component';

describe('DatabaseTagComponent', () => {
  let component: DatabaseTagComponent;
  let fixture: ComponentFixture<DatabaseTagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseTagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
