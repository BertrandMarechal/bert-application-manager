import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {animate, keyframes, query, stagger, style, transition, trigger} from '@angular/animations';

export type EntityDetailTypes =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'color'
  | 'link'
  | 'map'
  | 'composite'
  | 'weekDay'
  | 'invoiceType'
  | 'terminated'
  ;

export interface EntityDetailContainer<T> {
  name: string;
  entityDetails: EntityDetail<T>[];
  condition?: Function;
}

export interface EntityDetail<T> {
  name: string;
  key: keyof T;
  link?: string;
  linkId?: string;
  type?: EntityDetailTypes;
  size?: number;
  compose?: Function;
  booleanTrueValue?: string;
  booleanFalseValue?: string;
  editable?: boolean;
  roleCanEdit?: string | string[];
  entityType?: string;
}

export interface DetailsContainerOutput {
  key: string;
  value: Date | string | number | boolean;
  debounce: boolean;
}

@Component({
  selector: 'app-details-container',
  templateUrl: './details-container.component.html',
  styleUrls: ['./details-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailsAnimation', [
      transition('* => *', [
        query('.detail-card', style({ opacity: 0 }), { optional: true }),
        query('.detail-card', stagger('30ms', [
          animate('1s ease-in', keyframes([
            style({ opacity: 0, transform: 'translateX(-30%)', offset: 0 }),
            style({ opacity: .5, transform: 'translateX(5px)', offset: 0.3 }),
            style({ opacity: 1, transform: 'translateX(0)', offset: 1.0 }),
          ]))]), { optional: true })

      ])
    ])
  ]
})


export class DetailsContainerComponent {
  @Input() entity: any;
  @Input() details: EntityDetailContainer<any>[];
  @Output() selectionChange = new EventEmitter<DetailsContainerOutput>();

  change(value?: DetailsContainerOutput) {
    this.selectionChange.emit(value);
  }

}
