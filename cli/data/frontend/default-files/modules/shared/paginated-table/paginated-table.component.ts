import {
  ChangeDetectionStrategy,
  Component,
  ElementRef, EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {merge} from 'rxjs';
import {DatabasePaginationInput} from '@app/models/database-pagination.model';

@Component({
  selector: 'app-paginated-table',
  templateUrl: './paginated-table.component.html',
  styleUrls: ['./paginated-table.component.scss'],
  styles: [':host/deep/ .mat-form-field-underline {background-color: #768eb0!important; margin-top:2px}',
    ':host/deep/ .mat-form-field-label {color: white!important}',
    ':host/deep/ .mat-form-field-ripple {display:none !important}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatedTableComponent {
  @Input() itemList: any[];
  @Input() displayAttributes: string[] = ['name'];
  @Input() displayAttribute = 'name';
  @Input() linkAttribute = 'id';
  @Input() postLinkAttribute: string = null;
  @Input() parentRouteParams: string;
  @Input() title: string;
  @Input() newRouterLink: string;
  @Input() showNew = false;
  @Input() loading = false;
  @Input() sorting: boolean;
  @Input() color: string;
  @Input() boxShadow?: boolean;

  @Output() loadData = new EventEmitter<DatabasePaginationInput>();

  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild('filterInput', {static: false}) filterInput: ElementRef;

  dataSource: MatTableDataSource<any>;
  _showFilter = false;
  _filter: string;
  params: DatabasePaginationInput;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.itemList && changes['itemList'].currentValue) {
      this.dataSource = new MatTableDataSource<any>(changes['itemList'].currentValue);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
        merge(this.sort.sortChange, this.paginator.page).subscribe(() => {
          this.params = {
            from: this.paginator.pageIndex * this.paginator.pageSize,
            size: this.paginator.pageSize,
            direction: this.sort.direction,
            sorting: this.sort.active
          };
          this.loadData.emit(this.params);
        });
      }
    }, 100);
  }

  onShowFilter() {
    this._showFilter = true;
    setTimeout(() => {
      this.filterInput.nativeElement.focus();
    }, 50);
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.dataSource.filter = '';
      this._showFilter = false;
    }
    this.dataSource.filter = (event.target as any).value.trim().toLocaleLowerCase();
  }

  sortData() {
    this._filter = 'sorting';
    this._showFilter = true;
    this.sorting = true;
  }
}
