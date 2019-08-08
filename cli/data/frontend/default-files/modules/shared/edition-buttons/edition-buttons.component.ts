import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-edition-buttons',
  templateUrl: './edition-buttons.component.html',
  styleUrls: ['./edition-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditionButtonsComponent {
  @Input() showCancel = true;
  @Input() showDelete = true;

  @Input() canSave = false;
  @Input() cancelLink: string;
  @Input() orientation = 'right';

  @Output() save = new EventEmitter();
  @Output() cancel = new EventEmitter();
  @Output() delete = new EventEmitter();
}
