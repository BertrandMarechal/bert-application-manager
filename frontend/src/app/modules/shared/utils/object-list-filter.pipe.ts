import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectListFilter'
})
export class ObjectListFilterPipe implements PipeTransform {

  transform(list: object[], filter: string, filterName: string): object[] {
    if (!filter) {
      return list;
    }
    filter = filter.toLowerCase();
    return (list || []).filter(item => item[filterName].toLowerCase().indexOf(filter) > -1);
  }
}
