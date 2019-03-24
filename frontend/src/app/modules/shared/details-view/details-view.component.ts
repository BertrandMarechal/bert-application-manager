import { Component, OnInit, Input } from '@angular/core';

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
}
