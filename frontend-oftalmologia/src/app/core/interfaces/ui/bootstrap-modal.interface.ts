import { TemplateRef, Type } from '@angular/core';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ButtonAction } from './ui.interface';

export interface BootstrapModalConfig<T> {
  component?: Type<any>;
  template?: TemplateRef<any>;
  options?: NgbModalOptions;
  data?: T;
}

export interface ModalWithAction<T> {
  buttonAction: ButtonAction;
  selectedRow?: T;
}
