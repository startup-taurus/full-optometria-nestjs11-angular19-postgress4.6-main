import { Injectable } from '@angular/core'
import { environment } from '@environment/environment'
import * as CryptoJS from 'crypto-js'
import SecureStorage from 'secure-web-storage'
const secretKey = environment.secretKey

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  public secureStorage = new SecureStorage(localStorage, {
    hash: function hash(key: any) {
      key = CryptoJS.SHA256(key, { secretKey })
      return key.toString()
    },
    encrypt: function encrypt(data: any) {
      data = CryptoJS.AES.encrypt(data, secretKey)
      data = data.toString()
      return data
    },
    decrypt: function decrypt(data: any) {
      data = CryptoJS.AES.decrypt(data, secretKey)
      data = data.toString(CryptoJS.enc.Utf8)
      return data
    },
  })
  parseJwt = (token: string) => {
    let base64Url = token.split('.')[1]
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    let jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
    return JSON.parse(jsonPayload)
  }
}
