import { Component, OnInit, Input } from '@angular/core';
import { DatabaseSubObject } from '@app/models/database-file.model';

@Component({
  selector: 'app-function',
  templateUrl: './function.component.html',
  styleUrls: ['./function.component.scss']
})
export class FunctionComponent implements OnInit {
  @Input() function: DatabaseSubObject;

  constructor() { }

  ngOnInit() {
  }

}
