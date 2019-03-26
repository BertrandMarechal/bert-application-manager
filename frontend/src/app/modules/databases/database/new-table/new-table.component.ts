import { Component, OnInit, Input } from '@angular/core';
import { DatabaseObject, DatabaseTableField } from '@app/models/database-file.model';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000
});

@Component({
  selector: 'app-new-table',
  templateUrl: './new-table.component.html',
  styleUrls: ['./new-table.component.scss']
})
export class NewTableComponent implements OnInit {
  @Input() database: DatabaseObject;
  tableNameControl: FormControl;
  fieldFormGroup: FormGroup;
  _computedTableName: string;
  _tableSuffix: string;
  _fields: DatabaseTableField[];

  constructor() { }

  ngOnInit() {
    this._fields = [];
    this.tableNameControl = new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      this.tableNameValidator.bind(this)
    ]);
    this.fieldFormGroup = new FormGroup({
      name: new FormControl(null, [
        Validators.required,
        Validators.minLength(3)
      ]),
      type: new FormControl('TEXT', [
        Validators.required,
        Validators.minLength(3)
      ]),
      isForeignKey: new FormControl(false),
      hasDefault: new FormControl(false),
      defaultValue: new FormControl(null),
      isUnique: new FormControl(false),
      isNotNull: new FormControl(false),
      foreignKeyTable: new FormControl(false)
    });
  }
  onAddField() {
    console.log(this.fieldFormGroup.value);

    this._fields.push({
      name: this.fieldFormGroup.value.name,
      default: this.fieldFormGroup.value.isDefault,
      isPrimaryKey: false,
      isForeignKey: this.fieldFormGroup.value.isForeignKey,
      notNull: this.fieldFormGroup.value.isNotNull,
      type: this.fieldFormGroup.value.type,
      defaultValue: this.fieldFormGroup.value.defaultValue,
      foreignKey: this.fieldFormGroup.value.isForeignKey ? {
        key: this.database.table[this.fieldFormGroup.value.foreignKeyTable].primaryKey ?
          this.database.table[this.fieldFormGroup.value.foreignKeyTable].primaryKey.name : '',
        table: this.fieldFormGroup.value.isForeignKey
      } : null
    });
    Toast.fire({
      type: 'success',
      title: 'Added'
    });
  }

  tableNameValidator(control: FormControl) {
    if (control.value) {
      if (!control.value.match(/_[a-z]{3}$/i)) {
        return {missingSuffix: true};
      }
      this._tableSuffix = control.value.match(/_(?<suffix>[a-z]{3})$/i).groups.suffix;
      this._computedTableName = this.database._properties.dbName + 't_' + control.value;
      if (this.database.table[this._computedTableName]) {
        return {alreadyUsed: true};
      }
    }
  }

}
