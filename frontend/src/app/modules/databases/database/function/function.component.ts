import { Component, OnInit, Input } from '@angular/core';
import { DatabaseFunction } from '@app/models/database-file.model';

@Component({
  selector: 'app-function',
  templateUrl: './function.component.html',
  styleUrls: ['./function.component.scss']
})
export class FunctionComponent implements OnInit {
  @Input() function: DatabaseFunction;

  constructor() { }

  ngOnInit() {
  }

}
