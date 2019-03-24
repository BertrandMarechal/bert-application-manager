import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectKeys'
})
export class ObjectKeysPipe implements PipeTransform {

  transform(value: object): any[] {
    return Object.keys(value || {}).map(key => value[key]);
  }

}
