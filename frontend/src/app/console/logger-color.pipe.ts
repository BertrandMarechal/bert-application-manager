import { Pipe, PipeTransform } from '@angular/core';
import { LoggingParams } from '../services/localhost.service';

@Pipe({
  name: 'loggerColor'
})
export class LoggerColorPipe implements PipeTransform {

  transform(params: LoggingParams): string {
    if (params) {
      if (params.color) {
        return params.color;
      }
      switch (params.type) {
        case 'error':
          return 'red';
        case 'info':
          return 'blue';
        case 'success':
          return 'green';
        case 'warning':
          return 'orange';
        default:
          break;
      }
    }
    return 'black';
  }

}
