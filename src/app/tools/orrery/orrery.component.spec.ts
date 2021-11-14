import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrreryComponent } from './orrery.component';

describe('OrreryComponent', () => {
  let component: OrreryComponent;
  let fixture: ComponentFixture<OrreryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrreryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrreryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
