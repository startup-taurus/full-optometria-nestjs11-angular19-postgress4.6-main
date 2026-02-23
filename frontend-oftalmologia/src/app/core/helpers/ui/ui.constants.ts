import { GlobalConfig, IndividualConfig } from 'ngx-toastr'
import Swal from 'sweetalert2'

export const FORMAT_FOR_DATES = 'yyyy/MM/dd HH:mm'

export const FORMAT_FOR_DATES_SHORT = 'dd/MM/yyyy'

export const DEFAULT_GLOBAL_TOASTR_CONFIG: Partial<GlobalConfig> = {
  maxOpened: 1,
  autoDismiss: true,
  preventDuplicates: true,
}

export const DEFAULT_INDIVIDUAL_TOASTR_CONFIG: Partial<IndividualConfig<any>> =
  {
    positionClass: 'custom-toastr-top',
    closeButton: true,
    progressBar: true,
    timeOut: 3000,
    easeTime: 500,
    easing: 'ease-in-out',
    progressAnimation: 'decreasing',
  }

export const DEFAULT_SEARCH_NG_SELECT_PAGINATION = {
  LIMIT: 10,
  PAGE: 1,
}

export const swalWithBootstrapButtons = Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-secondary',
    cancelButton: 'btn btn-danger',
    actions: 'd-flex gap-2',
  },
  buttonsStyling: false,
  reverseButtons: true,
})

export const SWAL_DELETE_CONFIRM_CONFIG = {
  icon: 'warning' as const,
  showCancelButton: true,
  confirmButtonColor: '#dc3545',
  cancelButtonColor: '#6c757d',
  reverseButtons: true,
}

export const SWAL_SUCCESS_CONFIG = {
  icon: 'success' as const,
  timer: 2000,
  showConfirmButton: false,
}


export const SWAL_ERROR_CONFIG = {
  icon: 'error' as const,
  confirmButtonText: 'Aceptar',
  confirmButtonColor: '#dc3545',
}
