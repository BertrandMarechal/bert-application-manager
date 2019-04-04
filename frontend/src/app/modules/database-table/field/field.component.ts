import { Component, Input, ChangeDetectionStrategy, OnInit, Output, EventEmitter } from '@angular/core';
import { DatabaseTableField, DatabaseTable, Tag } from '@app/models/database-file.model';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AvailableTag, getAvailableTags } from '@app/models/database-tag.model';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldComponent implements OnInit {
  @Input() field: DatabaseTableField;
  @Input() table: DatabaseTable;
  @Input() canEdit = true;
  @Output() close = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() addTag = new EventEmitter<AvailableTag>();
  @Output() removeTag = new EventEmitter<Tag>();
  form: FormGroup;
  _edit: boolean;
  availableTags: AvailableTag[];

  ngOnInit(): void {
    this.availableTags = [];
    this.availableTags = getAvailableTags('field', this.field.tags, this.field);
    if (!this.field) {
      this.field = new DatabaseTableField();
      this._edit = true;
    }
    this.form = new FormGroup({
      name: new FormControl({
        value: this.field.name,
        disabled: !!this.field.name
      }, [Validators.required, this.nameValidator.bind(this)]),
      type: new FormControl(this.field.type, Validators.required),
      notNull: new FormControl(this.field.notNull),
      unique: new FormControl(this.field.unique),
      default: new FormControl(this.field.default),
      defaultValue: new FormControl(this.field.defaultValue),
    });
  }

  onCancel() {
    if (this.field.name) {
      this._edit = false;
      this.form.reset();
    } else {
      this.close.emit(null);
    }
  }
  onDelete() {
    this.delete.emit(null);
  }

  nameValidator(control: FormControl): {[error: string]: boolean} {
    return null;
  }
}
