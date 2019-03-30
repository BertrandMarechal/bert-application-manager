import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatabaseTable } from '@app/models/database-file.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {
  @Input() table: DatabaseTable;
}
