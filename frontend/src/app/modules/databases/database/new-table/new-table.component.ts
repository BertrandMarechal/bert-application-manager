import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DatabaseObject, DatabaseTableField } from '@app/models/database-file.model';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { trigger, transition, query, style, stagger, animate, keyframes } from '@angular/animations';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000
});

@Component({
  selector: 'app-new-table',
  templateUrl: './new-table.component.html',
  styleUrls: ['./new-table.component.scss'],
  animations: [
    trigger('fieldsAnimation', [
      transition('* => *', [
        query('.field', style({opacity: 0}), {optional: true}),
        query('.field', stagger('50ms', [
          animate('200ms ease-in', keyframes([
            style({opacity: 0, transform: 'translateY(-20%)', offset: 0.7}),
            style({opacity: .5, transform: 'translateY(5px)', offset: 0.8}),
            style({opacity: 1, transform: 'translateY(0)', offset: 1}),
          ]))]), {optional: true})
      ])
    ])
  ]
})
export class NewTableComponent implements OnInit, AfterViewInit {
  @Input() database: DatabaseObject;
  @ViewChild('tableName') tableName: ElementRef;
  tableNameControl: FormControl;
  tableSuffixControl: FormControl;
  fieldFormGroup: FormGroup;
  _computedTableName: string;
  _editTableName: boolean;
  _tableSuffix: string;
  _fields: DatabaseTableField[];
  _tempField: DatabaseTableField;
  _fieldPrefix: string;

  static getSuffix(tableName: string): string {
    const tableNameSplit = tableName.split('_').filter(Boolean);
    let suffix = tableNameSplit[0].substr(0, 1);
    // we first try one suffix, as we would like it, then we loop
    if (tableNameSplit.length >= 3) {
        suffix += tableNameSplit[1].substr(0, 1) + tableNameSplit[2].substr(0, 1);
    } else if (tableNameSplit.length === 2) {
        suffix += tableNameSplit[0].substr(1, 1) + tableNameSplit[1].substr(0, 1);
    } else {
        suffix = tableNameSplit[0].substr(0, 3);
    }
    return suffix;
  }

  constructor() { }

  ngOnInit() {
    this._tempField = new DatabaseTableField();
    this._editTableName = true;
    this._fields = [];
    this.tableNameControl = new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      this.tableNameValidator.bind(this)
    ]);
    this.tableSuffixControl = new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(3),
      this.tableSuffixValidator.bind(this)
    ]);

    this.tableNameControl.valueChanges.subscribe((value: string) => {
      if (value && value.length > 3) {
        this.tableSuffixControl.patchValue(NewTableComponent.getSuffix(value));
      }
    });
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

    this.fieldFormGroup.get('isForeignKey').valueChanges.subscribe((value => {
      if (value) {
        this._fieldPrefix = `fk_{{TAB}}_${this.tableSuffixControl.value}_`;
        this.fieldFormGroup.get('foreignKeyTable').setValidators(Validators.required);
        this.fieldFormGroup.get('type').patchValue('INTEGER');
      } else {
        this._fieldPrefix = `${this.tableSuffixControl.value}_`;
        this.fieldFormGroup.get('foreignKeyTable').patchValue(null);
        this.fieldFormGroup.get('foreignKeyTable').clearValidators();
      }
    }));
    this.fieldFormGroup.get('foreignKeyTable').valueChanges.subscribe((value => {
      if (value) {
        this._fieldPrefix = `fk_${this.database.table[value].tableSuffix}_${this.tableSuffixControl.value}_`;
        const variableName = this.database.table[value].name.split('_').slice(1, this.database.table[value].name.split('_').length - 1)
        this.fieldFormGroup.get('name').patchValue(variableName + '_id');
      }
    }));
    this.fieldFormGroup.valueChanges.subscribe((value) => {
      this.formToField(value);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.tableName.nativeElement.focus(), 50);
  }

  onTableNameKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'Escape') {
      if (this.tableNameControl && this.tableSuffixControl && this.tableNameControl.valid && this.tableSuffixControl.valid) {
        this._editTableName = false;
      }
    }
  }
  onTableNameBlur() {
    if (this.tableNameControl && this.tableSuffixControl && this.tableNameControl.valid && this.tableSuffixControl.valid) {
      this._editTableName = false;
    }
  }

  formToField(value: any) {
    if (value.isForeignKey && this.database.table[value.foreignKeyTable]) {
      const foreignKeyRegex = new RegExp(`^fk_${this.database.table[value.foreignKeyTable].tableSuffix}` +
        `_${this.tableSuffixControl.value}_[a-z0-9]`, 'i');
      if (!foreignKeyRegex.test(value.name)) {
        value.name = `fk_${this.database.table[value.foreignKeyTable].tableSuffix}` +
          `_${this.tableSuffixControl.value}_${value.name}`;
      }
    } else if (value.name) {
      if (value.name.indexOf(this.tableSuffixControl.value) === -1) {
        value.name = this.tableSuffixControl.value + '_' + value.name;
      }
    }

    this._tempField = {
      name: value.name,
      default: value.isDefault,
      isPrimaryKey: false,
      isForeignKey: value.isForeignKey,
      notNull: value.isNotNull,
      type: value.type,
      defaultValue: value.defaultValue,
      foreignKey: (value.isForeignKey && this.database.table[value.foreignKeyTable]) ? {
        key: this.database.table[value.foreignKeyTable].primaryKey ?
          this.database.table[value.foreignKeyTable].primaryKey.name : '',
        table: value.foreignKeyTable
      } : null
    };
  }
  onAddField() {
    this._fields.push(this._tempField);
    console.log(this._fields);
    Toast.fire({
      type: 'success',
      title: 'Added'
    });
    this.fieldFormGroup.reset();
    this._fieldPrefix = '';
  }

  tableNameValidator(control: FormControl) {
    if (control.value) {
      this._computedTableName = this.database._properties.dbName + 't_' + control.value + '_' + this.tableSuffixControl.value;
      if (this.database.table[this._computedTableName]) {
        return {alreadyUsed: true};
      }
    }
  }
  tableSuffixValidator(control: FormControl) {
    if (control.value) {
      if (!control.value.match(/^[a-z0-9]{3}$/i)) {
        return {invalidSuffix: true};
      }
      this._computedTableName = this.database._properties.dbName + 't_' + this.tableNameControl.value + '_' + control.value;
      this._fieldPrefix = `${this.tableSuffixControl.value}_`;
      if (this.database.table[this._computedTableName]) {
        return {alreadyUsed: true};
      }
    }
  }

}
