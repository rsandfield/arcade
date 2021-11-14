import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenagerieComponent } from './menagerie.component';

describe('MenagerieComponent', () => {
  let component: MenagerieComponent;
  let fixture: ComponentFixture<MenagerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenagerieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenagerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
