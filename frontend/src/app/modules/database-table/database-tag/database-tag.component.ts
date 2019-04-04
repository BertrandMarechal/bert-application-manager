import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Tag } from '@app/models/database-file.model';

@Component({
  selector: 'app-database-tag',
  templateUrl: './database-tag.component.html',
  styleUrls: ['./database-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabaseTagComponent {
  @Input() tag: Tag;
  @Output() remove = new EventEmitter();
}
