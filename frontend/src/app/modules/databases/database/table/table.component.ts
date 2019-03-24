import { Component, OnInit, Input } from '@angular/core';
import { DatabaseTable } from '@app/models/database-file.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @Input() table: DatabaseTable;
  showNewField: boolean;

  constructor() { }

  ngOnInit() {
  }

}
