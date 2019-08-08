import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditionButtonsComponent } from './edition-buttons.component';

describe('EditionButtonsComponent', () => {
  let component: EditionButtonsComponent;
  let fixture: ComponentFixture<EditionButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditionButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
