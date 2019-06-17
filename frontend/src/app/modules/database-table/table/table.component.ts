import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import * as fromDatabaseTable from '@app/store/reducers/database-table.reducers';
import * as DatabaseTableActions from '@app/store/actions/database-table.actions';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AvailableTag, getAvailableTags } from '@app/models/database-tag.model';
import Swal from 'sweetalert2';
import { Tag, DatabaseTableField } from '@app/models/database-file.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit {
  filter: string;
  databaseTable$: Observable<fromDatabaseTable.State>;

  availableTags: AvailableTag[];
  databaseTableName: string;

  constructor(
    private store: Store<fromDatabaseTable.State>
  ) { }

  ngOnInit() {
    this.availableTags = [];
    this.databaseTable$ = this.store.pipe(select('databaseTable'));
    this.databaseTable$.subscribe((state: fromDatabaseTable.State) => {
      if (state.databaseTable) {
        this.availableTags = getAvailableTags('table', state.databaseTable.tags, state.databaseTable);
        this.databaseTableName = state.databaseTable.name;
      }
    });
  }

  async onSelectTag(params: { tag: AvailableTag, field?: DatabaseTableField }) {
    if (params.tag.needsValue) {
      const swalResult = await Swal.fire({
        title: 'Add Tag',
        text: params.tag.description,
        input: 'text',
        inputValidator: (value) => {
          if (params.tag.valueRegex && !params.tag.valueRegex.test(value)) {
            Swal.showValidationMessage(`Invalid value`);
            return `Invalid value`;
          }
        },
      });
      if (!swalResult.dismiss) {
        if (params.field) {
          this.store.dispatch(new DatabaseTableActions.PageAddFieldTag({
            tagName: params.tag.name,
            tagValue: swalResult.value,
            fieldName: params.field.name,
          }));
        } else {
          this.store.dispatch(new DatabaseTableActions.PageAddTableTag({
            tagName: params.tag.name,
            tagValue: swalResult.value,
          }));
        }
      }
    } else {
      if (params.field) {
        this.store.dispatch(new DatabaseTableActions.PageAddFieldTag({
          tagName: params.tag.name,
          tagValue: null,
          fieldName: params.field.name,
        }));
      } else {
        this.store.dispatch(new DatabaseTableActions.PageAddTableTag({
          tagName: params.tag.name,
          tagValue: null,
        }));
      }
    }
  }

  onRemoveTag(params: { tag: Tag, field?: DatabaseTableField }) {
    if (params.field) {
      this.store.dispatch(new DatabaseTableActions.PageRemoveFieldTag({
        tagName: params.tag.name,
        fieldName: params.field.name
      }));
    } else {
      this.store.dispatch(new DatabaseTableActions.PageRemoveTableTag({
        tagName: params.tag.name,
      }));
    }
  }
  onEditTable() {
    this.store.dispatch(new DatabaseTableActions.PageEditTable());
  }
}
