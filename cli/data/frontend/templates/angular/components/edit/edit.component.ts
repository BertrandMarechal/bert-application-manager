import {Component, OnInit} from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs';
import * as from<capitalized_camel_cased_name> from '@app/store/reducers/<name_with_dashes>.reducers';
import * as <capitalized_camel_cased_name>Actions from '@app/store/actions/<name_with_dashes>.actions';
import {Store} from '@ngrx/store';
import {<capitalized_camel_cased_name>} from '@app/models/<name_with_dashes>.model';

@Component({
  selector: 'app-<name_with_dashes>-edit',
  templateUrl: './<name_with_dashes>-edit.component.html'
})
export class <capitalized_camel_cased_name>DetailsComponent implements OnInit {
  <camel_cased_name>Store$: Observable<from<capitalized_camel_cased_name>.State>;
  form: FormGroup;
  <camel_cased_name>: <capitalized_camel_cased_name>;

  constructor(
    private store: Store<from<capitalized_camel_cased_name>.FeatureState>
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.<camel_cased_name>Store$ = this.store.select('<camel_cased_name>Store');
    this.initForm();
    this.<camel_cased_name>Store$.subscribe((state) => {
      if (this.<camel_cased_name> !== state.<camel_cased_name>) {
        this.<camel_cased_name> = state.<camel_cased_name>;
      }
      this.initForm();
    });
  }

  initForm() {
    this.<camel_cased_name> = this.<camel_cased_name> || new <capitalized_camel_cased_name>();
    this.form = new FormGroup({
<form_controls>
    });
  }

  onSave() {
    this.store.dispatch(new <capitalized_camel_cased_name>Actions.PageSave<capitalized_camel_cased_name>Action({
        ...this.<camel_cased_name>,
        ...this.form.value
      }));    
  }
  onCancel() {
    this.router.navigate(['..'], {relativeTo: this.route});
  }
}
