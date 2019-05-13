import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseLookupsComponent } from './database-lookups.component';

describe('DatabaseLookupsComponent', () => {
  let component: DatabaseLookupsComponent;
  let fixture: ComponentFixture<DatabaseLookupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseLookupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseLookupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
