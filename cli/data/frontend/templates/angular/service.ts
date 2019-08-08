import { Injectable } from '@angular/core';
import { LambdaService } from './lambda.service';
import {<capitalized_camel_cased_name>} from '@app/models/<name_with_dashes>.model.ts';

@Injectable({
  providedIn: 'root'
})
export class <capitalized_camel_cased_name>Service {
  constructor(
    private lambdaService: LambdaService
  ) {
  }

  <functions>
}
