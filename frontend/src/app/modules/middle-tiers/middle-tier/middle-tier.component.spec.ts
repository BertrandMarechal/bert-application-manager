import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddleTierComponent } from './middle-tier.component';

describe('MiddleTierComponent', () => {
  let component: MiddleTierComponent;
  let fixture: ComponentFixture<MiddleTierComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiddleTierComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiddleTierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
