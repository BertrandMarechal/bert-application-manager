import { Pipe, PipeTransform } from '@angular/core';
import {EntityDetailContainer} from './details-container.component';

@Pipe({
  name: 'detailContainerConditionFilter'
})
export class DetailContainerConditionFilterPipe implements PipeTransform {

  transform(details: EntityDetailContainer<any>[], entity: any): any {
    if (details && entity) {
      return details.filter(x => {
        return !x.condition || x.condition(entity);
      });
    }
    return details;
  }

}
