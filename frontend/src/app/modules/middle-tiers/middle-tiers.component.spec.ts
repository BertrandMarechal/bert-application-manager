import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddleTiersComponent } from './middle-tiers.component';

describe('MiddleTiersComponent', () => {
  let component: MiddleTiersComponent;
  let fixture: ComponentFixture<MiddleTiersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiddleTiersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiddleTiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
