import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-details-view',
  templateUrl: './details-view.component.html',
  styleUrls: ['./details-view.component.scss']
})
export class DetailsViewComponent {
  @Input() name: string;
  @Input() color: string;
  @Input() tabs: {
    name: string;
    link: string;
  }[];
  @Input() actions: {
    name: string;
    value: string;
  }[];
  @Output() actionClicked = new EventEmitter<{
    name: string;
    value: string;
  }>();
}
