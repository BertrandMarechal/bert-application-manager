import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-paginated-table',
  templateUrl: './paginated-table.component.html',
  styleUrls: ['./paginated-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatedTableComponent {
  @Input() title: string;
  @Input() linkAttribute: string;
  @Input() displayAttribute: string;

  @Input() showNew: boolean;
  @Input() loading: boolean;

  @Input() itemList: any[];
}
